import { App, getAllTags, getLinkpath, LinkCache, MarkdownPostProcessorContext, MarkdownView, TFile } from "obsidian"
import { SuperchargedLinksSettings } from "src/settings/SuperchargedLinksSettings"
import SuperchargedLinks from "../../main";

export function clearExtraAttributes(link: HTMLElement) {
    Object.values(link.attributes).forEach(attr => {
        if (attr.name.includes("data-link")) {
            link.removeAttribute(attr.name)
        }
    })
}


export function fetchTargetAttributesSync(app: App, settings: SuperchargedLinksSettings, dest: TFile, addDataHref: boolean): Record<string, string> {
    let new_props: Record<string, string> = { tags: "" }
    const cache = app.metadataCache.getFileCache(dest)
    if (!cache) return new_props;

    const frontmatter = cache.frontmatter

    if (frontmatter) {
        settings.targetAttributes.forEach(attribute => {
            if (Object.keys(frontmatter).includes(attribute)) {
                if (attribute === 'tag' || attribute === 'tags') {
                    new_props['tags'] += frontmatter[attribute];
                } else {
                    new_props[attribute] = frontmatter[attribute]
                }
            }
        })
    }

    if (settings.targetTags) {
        new_props["tags"] += getAllTags(cache).join(' ');
    }

    if (addDataHref) {
        new_props['data-href'] = dest.basename;
    }
    new_props['path'] = dest.path;
    //@ts-ignore
    const getResults = (api) => {
        const page = api.page(dest.path);
        if (!page) {
            return;
        }
        settings.targetAttributes.forEach((field: string) => {
            const value = page[field];
            if (value) new_props[field] = value;
        })
    };

    if (settings.getFromInlineField && app.plugins.enabledPlugins.has("dataview")) {
        const api = app.plugins.plugins.dataview?.api;
        if (api) {
            getResults(api)
        }
        // This is crashing for some people. I think ignoring it will be ok. 
        // else
        //     this.plugin.registerEvent(
        //         app.metadataCache.on("dataview:api-ready", (api: any) =>
        //             getResults(api)
        //         )
        //     );
    }
    // Replace spaces with hyphens in the keys of new_props
    const hyphenated_props: Record<string, string> = {};
    for (const key in new_props) {
        const hyphenatedKey = key.replace(/ /g, '-');
        hyphenated_props[hyphenatedKey] = new_props[key];
    }
    new_props = hyphenated_props;

    return new_props
}

export function processKey(key: string) {
    // Replace spaces with hyphens (v0.13.4+)
    return key.replace(/ /g, '-');
}

export function processValue(key: string, value: string) {
    // TODO: This is a hack specifically for Emile's setup. Should be commented in releases.
    if (key.contains("publishedIn") && value?.length && value.length === 1 && value[0].startsWith && value[0].startsWith("[[") && value[0].endsWith("]]")) {
        return value[0].slice(2, -2);
    }
    return value;
}

function setLinkNewProps(link: HTMLElement, new_props: Record<string, string>) {
    // @ts-ignore
    for (const a of link.attributes) {
        if (a.name.includes("data-link") && !(a.name in new_props)) {
            link.removeAttribute(a.name);
        }
    }
    Object.keys(new_props).forEach(key => {
        const dom_key = processKey(key);
        const name = "data-link-" + dom_key;
        const curValue = link.getAttribute(name);
        const newValue = processValue(key, new_props[key]);

        // Only update if value is different
        if (!newValue || curValue != newValue) {
            link.setAttribute(name, newValue)
            if (newValue?.startsWith && (newValue.startsWith('http') || newValue.startsWith('data:'))) {
                link.style.setProperty(`--data-link-${dom_key}`, `url(${newValue})`);
            } else {
                link.style.setProperty(`--data-link-${dom_key}`, newValue);
            }
        }
    });
    if (!link.hasClass("data-link-icon")) {
        link.addClass("data-link-icon");
    }
    if (!link.hasClass("data-link-icon-after")) {
        link.addClass("data-link-icon-after");
    }
    if (!link.hasClass("data-link-text")) {
        link.addClass("data-link-text");
    }
}

function updateLinkExtraAttributes(app: App, settings: SuperchargedLinksSettings, link: HTMLElement, destName: string) {
    const linkHref = link.getAttribute('href')?.split('#')?.[0];
    if (linkHref) {
        const dest = app.metadataCache.getFirstLinkpathDest(linkHref, destName);
        if (dest) {
            const new_props = fetchTargetAttributesSync(app, settings, dest, false);
            setLinkNewProps(link, new_props);
        }
    }
}

export function updateDivExtraAttributes(app: App, settings: SuperchargedLinksSettings, link: HTMLElement, destName: string, linkName?: string, filter_collapsible: boolean = false) {
    if (filter_collapsible && link.parentElement.getAttribute("class").contains('mod-collapsible')) return; // Bookmarks Folder
    if (!linkName) {
        linkName = link.textContent;
    }
    // Sometimes textContent refers to the alias, missing the base name/path. Then we need to explicitly get the base name/path from attributes.
    // Check for file name in various attributes, in order of preference
    const parent = link.parentElement;
    const attributeSources = [
        () => parent?.getAttribute('data-path'), // File Browser
        () => parent?.getAttribute("data-href"), // Bases
        () => parent?.getAttribute("href"), // Bases 
        () => link.getAttribute("data-href"), // Bases (v1.10+)
        () => link.getAttribute("href"), // Bases
        () => parent?.getAttribute("class") === "suggestion-content" && link.nextElementSibling 
            ? link.nextElementSibling.textContent + linkName : null // Auto complete
    ];

    for (const source of attributeSources) {
        const value = source();
        if (value) {
            linkName = value;
            break;
        }
    }
    const dest = app.metadataCache.getFirstLinkpathDest(getLinkpath(linkName), destName)

    if (dest) {
        const new_props = fetchTargetAttributesSync(app, settings, dest, true);
        setLinkNewProps(link, new_props);
    }
}


export function updateElLinks(app: App, plugin: SuperchargedLinks, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const settings = plugin.settings;
    const links = el.querySelectorAll('a.internal-link');
    const destName = ctx.sourcePath.replace(/(.*).md/, "$1");
    links.forEach((link: HTMLElement) => {
        updateLinkExtraAttributes(app, settings, link, destName);
    });
}


export function updatePropertiesPane(propertiesEl: HTMLElement, file: TFile, app: App, plugin: SuperchargedLinks) {
    const frontmatter = app.metadataCache.getCache(file.path)?.frontmatter;
    if(!!frontmatter) {
        const nodes = propertiesEl.querySelectorAll("div.multi-select-pill-content");
        for (let i = 0; i < nodes.length; ++i) {
            const el = nodes[i] as HTMLElement;
            const linkText = el.textContent;
            const keyEl = el.parentElement.parentElement.parentElement.parentElement.children[0].children[1];
            // @ts-ignore
            const key = keyEl.value;
            const listOfLinks: [string] = frontmatter[key];
            let foundS = null;
            if (!listOfLinks) {
                continue;
            }
            for (const s of listOfLinks) {
                if (s.length > 4 && s.startsWith("[[") && s.endsWith("]]")) {
                    const slicedS = s.slice(2, -2);
                    const split = slicedS.split("|");
                    if (split.length == 1 && split[0] == linkText) {
                        foundS = split[0];
                        break;
                    } else if (split.length == 2 && split[1] == linkText) {
                        foundS = split[0];
                        break;
                    }
                }
            }
            if (!!foundS) {
                updateDivExtraAttributes(plugin.app, plugin.settings, el, "", foundS);
            }
        }
        const singleNodes = propertiesEl.querySelectorAll("div.metadata-link-inner");
        for (let i = 0; i < singleNodes.length; ++i) {
            const el = singleNodes[i] as HTMLElement;
            const linkText = el.textContent;
            const keyEl = el.parentElement.parentElement.parentElement.children[0].children[1];
            // @ts-ignore
            const key = keyEl.value;
            const link: string = frontmatter[key];
            if (!link) {
                continue;
            }
            let foundS: string = null;
            if (link?.length > 4 && link.startsWith("[[") && link.endsWith("]]")) {
                const slicedS = link.slice(2, -2);
                const split = slicedS.split("|");
                if (split.length == 1 && split[0] == linkText) {
                    foundS = split[0];
                } else if (split.length == 2 && split[1] == linkText) {
                    foundS = split[0];
                }
            }
            if (!!foundS) {
                updateDivExtraAttributes(plugin.app, plugin.settings, el, "", foundS);
            }
        }
    }
}


export function updateVisibleLinks(app: App, plugin: SuperchargedLinks) {
    const settings = plugin.settings;
    app.workspace.iterateRootLeaves((leaf) => {
        if (leaf.view instanceof MarkdownView && leaf.view.file) {
            const file: TFile = leaf.view.file;
            const cachedFile = app.metadataCache.getFileCache(file);

            // @ts-ignore
            const metadata = leaf.view?.metadataEditor?.contentEl;
            if (!!metadata) {
                updatePropertiesPane(metadata, file, app, plugin);
            }

            //@ts-ignore
            const tabHeader: HTMLElement = leaf.tabHeaderInnerTitleEl;
            if (settings.enableTabHeader) {
                // Supercharge tab headers
                updateDivExtraAttributes(app, settings, tabHeader, "", file.path);
            }
            else {
                clearExtraAttributes(tabHeader);
            }

            if (cachedFile?.links) {
                cachedFile.links.forEach((link: LinkCache) => {
                    const fileName = file.path.replace(/(.*).md/, "$1")
                    const dest = app.metadataCache.getFirstLinkpathDest(link.link, fileName)
                    if (dest) {
                        const new_props = fetchTargetAttributesSync(app, settings, dest, false)
                        const internalLinks = leaf.view.containerEl.querySelectorAll(`a.internal-link[href="${link.link}"]`)
                        internalLinks.forEach((internalLink: HTMLElement) => setLinkNewProps(internalLink, new_props))
                    }
                })
            }
        }
    })
}
