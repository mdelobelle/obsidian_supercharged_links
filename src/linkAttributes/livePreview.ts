import {App, debounce, Debouncer, editorViewField, MarkdownView, TFile} from "obsidian";
import {SuperchargedLinksSettings} from "../settings/SuperchargedLinksSettings";
import {Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType} from "@codemirror/view";
import {RangeSet, RangeSetBuilder} from "@codemirror/state";
import {syntaxTree} from "@codemirror/language";
import {tokenClassNodeProp} from "@codemirror/language";
import {fetchTargetAttributesSync} from "./linkAttributes";
import {DefaultFunctions} from "obsidian-dataview/lib/expression/functions";

export function buildCMViewPlugin(app: App, _settings: SuperchargedLinksSettings)
{
    // Implements the live preview supercharging
    // Code structure based on https://github.com/nothingislost/obsidian-cm6-attributes/blob/743d71b0aa616407149a0b6ea5ffea28e2154158/src/main.ts
    // Code help credits to @NothingIsLost! They have been a great help getting this to work properly.
    class HeaderWidget extends WidgetType {
        attributes: Record<string, string>
        after: boolean

        constructor(attributes: Record<string, string>, after: boolean) {
            super();
            this.attributes = attributes
            this.after = after
        }

        toDOM() {
            let headerEl = document.createElement("span");
            headerEl.setAttrs(this.attributes);
            for (let key in this.attributes) {
                // CSS doesn't allow interpolation of variables for URLs, so do it beforehand to be nice.
                if (this.attributes[key]?.startsWith && (this.attributes[key].startsWith('http') || this.attributes[key].startsWith('data:'))) {
                    headerEl.style.setProperty(`--${key}`, `url(${this.attributes[key]})`);
                } else {
                    headerEl.style.setProperty(`--${key}`, this.attributes[key]);
                }
            }
            if (this.after) {
                headerEl.addClass('data-link-icon-after');
            }
            else {
                headerEl.addClass('data-link-icon')
            }
            // create a naive bread crumb
            return headerEl;
        }

        ignoreEvent() {
            return true;
        }
    }

    const settings = _settings;
    const viewPlugin = ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view);
            }

            update(update: ViewUpdate) {
                if (update.docChanged) {
                    this.decorations = this.decorations.map(update.changes);

                    update.changes.iterChanges((fromA, toA, fromB, toB, t) => {
                        // Update all 'line blocks' between the range changed. Prevents weird graphical bugs
                        const minFrom = update.view.lineBlockAt(fromB).from;
                        const maxTo = update.view.lineBlockAt(toB).to;
                        // remove things within bounds
                        this.decorations = this.decorations.update({
                            filter: (from, to) => to < minFrom || from > maxTo});

                        // Update decorations within bounds
                        this.decorations = RangeSet.join([this.decorations,
                            this.buildDecorations(update.view, minFrom, maxTo)]);
                    });
                }
                else if (update.viewportChanged) {
                    this.decorations = this.buildDecorations(update.view);
                }
            }

            destroy() {
            }

            buildDecorations(view: EditorView, updateFrom: number = -1, updateTo: number=-1) {
                let builder = new RangeSetBuilder<Decoration>();
                if (!settings.enableEditor) {
                    return builder.finish();
                }
                const mdView = view.state.field(editorViewField) as MarkdownView;
                let lastAttributes = {};
                let iconDecoAfter: Decoration = null;
                let iconDecoAfterWhere: number = null;

                let mdAliasFrom: number = null;
                let mdAliasTo: number = null;
                for (let {from, to} of view.visibleRanges) {
                    // When updating, only changes the range given.
                    if (updateFrom !== -1 && (to < updateFrom || from > updateTo)) continue;
                    syntaxTree(view.state).iterate({
                        from,
                        to,
                        enter: (node) => {
                            if (updateFrom !== -1 && (node.to < updateFrom || node.from > updateTo)) return;
                            const tokenProps = node.type.prop(tokenClassNodeProp);
                            if (tokenProps) {
                                const props = new Set(tokenProps.split(" "));

                                // Square Brackets of links both internal (`[[`, `]]`) and md link (`[`, `]`)
                                const isMDFormatting = props.has('formatting-link') || props.has('formatting-link-string');
                                if (isMDFormatting) return;

                                // Parts of internal links
                                const isLink = props.has("hmd-internal-link"); // [[`Note` or `|` or `Alias`]]
                                const isAlias = props.has("link-alias"); // [[Note| `Alias`]]
                                const isPipe = props.has("link-alias-pipe"); // [[Note `|` Alias]]

                                // The 'alias' of the md link (or its brackets)
                                const isMDLink = props.has('link'); // `[` or `Alias` or `]`(URL)
                                // The 'internal link' of the md link (or its brackets)
                                const isMDUrl = props.has('url'); // [Alias]`(` or `URL` or `)`

                                if (isMDLink) {
                                    // This catches the alias of md links i.e. [ `Alias` ](URL)
                                    // We'll apply the styling in the next iteration when we analyze the `URL`
                                    mdAliasFrom = node.from;
                                    mdAliasTo = node.to;
                                }

                                if (!isPipe && !isAlias) {
                                    if (iconDecoAfter) {
                                        builder.add(iconDecoAfterWhere, iconDecoAfterWhere, iconDecoAfter);
                                        iconDecoAfter = null;
                                        iconDecoAfterWhere = null;
                                    }
                                }
                                if (isLink && !isAlias && !isPipe || isMDUrl) {
                                    let linkText = view.state.doc.sliceString(node.from, node.to);
                                    linkText = linkText.split("#")[0];
                                    let file = app.metadataCache.getFirstLinkpathDest(linkText, mdView.file.basename);
                                    if (isMDUrl && !file) {
                                        try {
                                            file = app.vault.getAbstractFileByPath(decodeURIComponent(linkText)) as TFile;
                                        }
                                        catch(e) {}
                                    }
                                    if (file) {
                                        let _attributes = fetchTargetAttributesSync(app, settings, file, true);
                                        let attributes: Record<string, string> = {};
                                        for (let key in _attributes) {
                                            attributes["data-link-" + key] = _attributes[key];
                                        }
                                        let deco = Decoration.mark({
                                            attributes,
                                            class: "data-link-text"
                                        });
                                        let iconDecoBefore = Decoration.widget({
                                            widget: new HeaderWidget(attributes, false),
                                        });
                                        iconDecoAfter = Decoration.widget({
                                            widget: new HeaderWidget(attributes, true),
                                        });

                                        if (isMDUrl) {
                                            // Apply retroactively to the alias found before
                                            let deco = Decoration.mark({
                                                attributes: attributes,
                                                class: "data-link-text"
                                            });

                                            builder.add(mdAliasFrom, mdAliasFrom, iconDecoBefore);
                                            builder.add(mdAliasFrom, mdAliasTo, deco);
                                            if (iconDecoAfter) {
                                                builder.add(mdAliasTo, mdAliasTo, iconDecoAfter);
                                                iconDecoAfter = null;
                                                iconDecoAfterWhere = null;
                                                mdAliasFrom = null;
                                                mdAliasTo = null;
                                            }
                                        } else {
                                            builder.add(node.from, node.from, iconDecoBefore);
                                        }

                                        builder.add(node.from, node.to, deco);
                                        lastAttributes = attributes;
                                        iconDecoAfterWhere = node.to;
                                    }
                                } else if (isLink && isAlias) {
                                    let deco = Decoration.mark({
                                        attributes: lastAttributes,
                                        class: "data-link-text"
                                    });
                                    builder.add(node.from, node.to, deco);
                                    if (iconDecoAfter) {
                                        builder.add(node.to, node.to, iconDecoAfter);
                                        iconDecoAfter = null;
                                        iconDecoAfterWhere = null;
                                    }
                                }
                            }
                        }
                    })

                }
                return builder.finish();
            }
        },
        {
            decorations: v => v.decorations
        }
    );
    return viewPlugin;
}
