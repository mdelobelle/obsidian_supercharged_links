import SuperchargedLinks from "main"
import {
    Modal,
    Setting
} from "obsidian"
import {matchTypes, matchPreview, CSSLink, matchPreviewPath, selectorType, SelectorTypes, MatchTypes} from './cssLink'
import {SuperchargedLinksSettings} from "../settings/SuperchargedLinksSettings";

export function displayText(link: CSSLink, settings: SuperchargedLinksSettings): string {
    if (link.type === 'tag') {
        if (!link.value) {
            return "<b>Please choose a tag</b>";
        }
        return `<span class="data-link-icon data-link-text data-link-icon-after" data-link-tags="${link.value}">Note</span> has tag <a class="tag">#${link.value}</a>`;
    }
    else if (link.type === 'attribute') {
        if (settings.targetAttributes.length === 0) {
            return `<b>No attributes added to "Target attributes". Go to plugin settings to add them.</b>`
        }
        if (!link.name) {
            return "<b>Please choose an attribute name.</b>";
        }
        if (!link.value){
            return "<b>Please choose an attribute value.</b>"
        }
        return `<span class="data-link-icon data-link-text data-link-icon-after" data-link-${link.name}="${link.value}">Note</span> has attribute <b>${link.name}</b> ${matchPreview[link.match]} <b>${link.value}</b>.`;
    }
    if (!link.value) {
        return "<b>Please choose a path.</b>"
    }
    return `The path of the <span class="data-link-icon data-link-text data-link-icon-after" data-link-path="${link.value}">note</span> ${matchPreviewPath[link.match]} <b>${link.value}</b>`
}

export function updateDisplay(textArea: HTMLElement, link: CSSLink, settings: SuperchargedLinksSettings): boolean {
    let toDisplay: string = displayText(link, settings);
    let disabled = false;
    if (link.type === 'tag') {
        if (!link.value) {
            disabled = true;
        }
    }
    else if (link.type === 'attribute') {
        if (settings.targetAttributes.length === 0) {
            disabled = true;
        }
        else if (!link.name) {
            disabled = true;
        }
        else if (!link.value){
            disabled = true;
        }
    }
    else {
        if (!link.value) {
            disabled = true;
        }
    }
    textArea.innerHTML = toDisplay;
    return disabled;
}

class CSSBuilderModal extends Modal {

    plugin: SuperchargedLinks
    cssLink: CSSLink
    saveCallback: (cssLink: CSSLink) => void;

    constructor(plugin: SuperchargedLinks, saveCallback: (cssLink: CSSLink) => void, cssLink: CSSLink=null) {
        super(plugin.app)
        this.cssLink = cssLink;
        if (!cssLink) {
            this.cssLink = new CSSLink();
        }
        this.plugin = plugin;
        this.saveCallback = saveCallback;
    }



    onOpen() {
        this.titleEl.setText(`Select what links to style!`)
        // is tag
        const matchAttrPlaceholder = "Attribute value to match.";
        const matchTagPlaceholder = "Note tag to match (without #).";
        const matchPathPlaceholder = "File path to match.";
        const matchAttrTxt = "Attribute value";
        const matchTagTxt = "Tag";
        const matchPathTxt = "Path";

        const cssLink = this.cssLink;
        const plugin = this.plugin;

        this.contentEl.addClass("supercharged-modal");

        // Type
        new Setting(this.contentEl)
            .setName("Type of selector")
            .setDesc("Attributes selects YAML and DataView attributes" +
                ", tags chooses the tags of a note, and path considers the name of the note including in what folder it is.")
            .addDropdown(dc => {
                Object.keys(selectorType).forEach((type: SelectorTypes) => {
                    dc.addOption(type, selectorType[type]);
                    if (type === this.cssLink.type) {
                        dc.setValue(type);
                    }
                });
                dc.onChange((type: SelectorTypes) => {
                    cssLink.type = type;
                    updateContainer(cssLink.type);
                    saveButton.setDisabled(updateDisplay(preview, this.cssLink, this.plugin.settings));
                });
            });

        // attribute name
        const attrName = new Setting(this.contentEl)
            .setName("Attribute name")
            .setDesc("What attribute to target? Make sure to first add target attributes to the settings at the top!")
            .addDropdown(dc => {
                plugin.settings.targetAttributes.forEach((attribute: string) => {
                    dc.addOption(attribute, attribute);
                    if (attribute === cssLink.name) {
                        dc.setValue(attribute);
                    }
                });
                dc.onChange(name => {
                    cssLink.name = name;
                    saveButton.setDisabled(updateDisplay(preview, cssLink, plugin.settings));
                });
            })


        // attribute value
        const attrValue = new Setting(this.contentEl)
            .setName("Value to match")
            .setDesc("TODO")
            .addText(t => {
                t.setValue(cssLink.value);
                t.onChange(value => {
                        cssLink.value = value;
                        saveButton.setDisabled(updateDisplay(preview, cssLink, plugin.settings));
                });
            });

        this.contentEl.createEl('h4', {text: 'Advanced'});
        // matching type
        const matchingType = new Setting(this.contentEl)
            .setName("Matching type")
            .setDesc("How to compare the attribute or path with the given value.")
            .addDropdown(dc => {
                Object.keys(matchTypes).forEach((key: MatchTypes)=> {
                    dc.addOption(key, matchTypes[key])
                    if (key == cssLink.match) {
                        dc.setValue(key)
                    }
                })
                dc.onChange((value: "exact" | "contains" | "startswith" | "endswith") => {
                    cssLink.match = value;
                    saveButton.setDisabled(updateDisplay(preview, cssLink, plugin.settings));
                });
            })


        // case sensitive
        const caseSensitiveTogglerContainer = new Setting(this.contentEl)
            .setName("Case sensitive matching")
            .setDesc("Should the matching of the value be case sensitive?")
            .addToggle(b => {
                b.setValue(cssLink.matchCaseSensitive);
                b.onChange(value => {
                    cssLink.matchCaseSensitive = value;
                    b.setDisabled(updateDisplay(preview, cssLink, plugin.settings));
                });
            })

        if (!this.cssLink.name && this.plugin.settings.targetAttributes.length > 0) {
           this.cssLink.name = this.plugin.settings.targetAttributes[0];
        }

        const updateContainer = function(type: SelectorTypes) {
            if (type === 'attribute') {
                attrName.settingEl.show();
                attrValue.nameEl.setText(matchAttrTxt);
                attrValue.descEl.setText(matchAttrPlaceholder);
                matchingType.settingEl.show();
                caseSensitiveTogglerContainer.settingEl.show();
            }
            else if (type === 'tag') {
                attrName.settingEl.hide();
                attrValue.nameEl.setText(matchTagTxt);
                attrValue.descEl.setText(matchTagPlaceholder);
                matchingType.settingEl.hide();
                caseSensitiveTogglerContainer.settingEl.hide();
            }
            else {
                attrName.settingEl.hide();
                attrValue.nameEl.setText(matchPathTxt);
                attrValue.descEl.setText(matchPathPlaceholder);
                matchingType.settingEl.show();
                caseSensitiveTogglerContainer.settingEl.show();
            }
        }

        new Setting(this.contentEl)
            .setName("Style options")
            .setDesc("What styling options are active? " +
                "Disabling options you won't use can improve performance slightly.")
            .addToggle(t => {
                t.onChange(value => {
                    cssLink.selectText = value;
                })
                t.setValue(cssLink.selectText);
                t.setTooltip("Style link text");
            })
            .addToggle(t => {
                t.onChange(value => {
                    cssLink.selectPrepend = value;
                })
                t.setValue(cssLink.selectPrepend);
                t.setTooltip("Add content before link");
            })
            .addToggle(t => {
                t.onChange(value => {
                    cssLink.selectAppend = value;
                })
                t.setValue(cssLink.selectAppend);
                t.setTooltip("Add content after link");
            })
            .addToggle(t => {
                t.onChange(value => {
                    cssLink.selectBackground = value;
                })
                t.setValue(cssLink.selectBackground);
                t.setTooltip("Add optional background or underline to link");
            });


        this.contentEl.createEl('h4', {text: 'Result'});
        const modal = this;
        const saveButton = new Setting(this.contentEl)
            .setName("Preview")
            .setDesc("")
            .addButton(b => {
                b.setButtonText("Save")
                b.onClick(() => {
                    modal.saveCallback(cssLink);
                    modal.close();
                });
            });
        // generate button

        const preview = saveButton.nameEl;
        updateContainer(cssLink.type);
        saveButton.setDisabled(updateDisplay(preview, this.cssLink, this.plugin.settings));
    }

}

export { CSSBuilderModal }