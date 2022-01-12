import { App, getAllTags, getLinkpath, LinkCache, MarkdownPostProcessorContext, MarkdownView, TFile } from "obsidian"
import { SuperchargedLinksSettings } from "src/settings/SuperchargedLinksSettings"

export function clearExtraAttributes(link: HTMLElement) {
    Object.values(link.attributes).forEach(attr => {
        if (attr.name.startsWith("data-link")) {
            link.removeAttribute(attr.name)
        }
    })
}

export function fetchFrontmatterTargetAttributesSync(app: App, settings: SuperchargedLinksSettings, dest: TFile, addDataHref: boolean): Record<string, string> {
    let new_props: Record<string, string> = {tags: ""}
    const cache = app.metadataCache.getFileCache(dest)
    if (!cache) return;

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
    return new_props
}

export function fetchFrontmatterTargetAttributes(app: App, settings: SuperchargedLinksSettings, dest: TFile, addDataHref: boolean): Promise<Record<string, string>> {
    return new Promise(async (resolve, reject) => {
        const cache = app.metadataCache.getFileCache(dest)
        if (!cache) return;
        const new_props = fetchFrontmatterTargetAttributesSync(app, settings, dest, addDataHref);

        if (settings.getFromInlineField) {
            const regex = new RegExp(`(${settings.targetAttributes.join("|")})::(.+)?`, "g");
            await app.vault.cachedRead(dest).then((result) => {
                const matches = result.matchAll(regex);
                for (const match of matches) {
                    if (match[2] !== undefined) {
                        new_props[match[1]] = match[2].replace(/^\[(.*)\]$/, "$1").trim();
                    }
                }
            })
        }

        resolve(new_props)
    })
}

function setLinkNewProps(link: HTMLElement, new_props: Record<string, string>) {
    Object.keys(new_props).forEach(key => {
        link.setAttribute("data-link-" + key, new_props[key])
        link.addClass("data-link-icon");
    })
}

function updateLinkExtraAttributes(app: App, settings: SuperchargedLinksSettings, link: HTMLElement, destName: string) {
    const linkHref = link.getAttribute('href').split('#')[0];
    const dest = app.metadataCache.getFirstLinkpathDest(linkHref, destName)

    if (dest) {
        fetchFrontmatterTargetAttributes(app, settings, dest, false).then(new_props => setLinkNewProps(link, new_props))
    }
}

export function updateDivExtraAttributes(app: App, settings: SuperchargedLinksSettings, link: HTMLElement, destName: string, linkName?: string) {
    if (!linkName) {
        linkName = link.textContent;
    }
    const dest = app.metadataCache.getFirstLinkpathDest(getLinkpath(linkName), destName)

    if (dest) {
        fetchFrontmatterTargetAttributes(app, settings, dest, true).then(new_props => setLinkNewProps(link, new_props))
    }
}


export function updateDivLinks(app: App, settings: SuperchargedLinksSettings) {
    const divs = fishAll('div.internal-link');
    divs.push(...fishAll('td.internal-link'));

    divs.forEach((link: HTMLElement) => {
        clearExtraAttributes(link);
        updateDivExtraAttributes(app, settings, link, "");
    })

    const fileDivs = fishAll('div.nav-file-title-content')
    fileDivs.forEach((link: HTMLElement) => {
        clearExtraAttributes(link);
        if (settings.enableFileList) {
            updateDivExtraAttributes(app, settings, link, "");
        }
    })
}

export function updateElLinks(app: App, settings: SuperchargedLinksSettings, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const links = el.querySelectorAll('a.internal-link');
    const destName = ctx.sourcePath.replace(/(.*).md/, "$1");
    links.forEach((link: HTMLElement) => {
        clearExtraAttributes(link);
        updateLinkExtraAttributes(app, settings, link, destName);
    })
}

export function updateVisibleLinks(app: App, settings: SuperchargedLinksSettings) {
    fishAll("a.internal-link").forEach(internalLink => clearExtraAttributes(internalLink))
    app.workspace.iterateRootLeaves((leaf) => {
        if (leaf.view instanceof MarkdownView && leaf.view.file) {
            const file: TFile = leaf.view.file;
            const cachedFile = app.metadataCache.getFileCache(file)
            if (cachedFile.links) {
                cachedFile.links.forEach((link: LinkCache) => {
                    const fileName = file.path.replace(/(.*).md/, "$1")
                    const dest = app.metadataCache.getFirstLinkpathDest(link.link, fileName)
                    if (dest) {
                        fetchFrontmatterTargetAttributes(app, settings, dest, false).then(new_props => {
                            const internalLinks = leaf.view.containerEl.querySelectorAll(`a.internal-link[href="${link.link}"]`)
                            internalLinks.forEach((internalLink: HTMLElement) => setLinkNewProps(internalLink, new_props))
                        })
                    }
                })
            }
        }
    })
}
