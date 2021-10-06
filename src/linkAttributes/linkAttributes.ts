import {App, LinkCache, MarkdownPostProcessorContext, MarkdownView, TFile} from "obsidian"
import {SuperchargedLinksSettings} from "src/settings/SuperchargedLinksSettings"

export function clearExtraAttributes(link: HTMLElement){
    Object.values(link.attributes).forEach(attr =>{
        if(attr.name.startsWith("data-link")){
            link.removeAttribute(attr.name)
        }
    })
}

function fetchFrontmatterTargetAttributes(app: App, settings: SuperchargedLinksSettings, dest: TFile): Promise<Record<string, string>>{
    let new_props: Record<string, string> = {}
    return new Promise((resolve, reject) => {
        const cache = app.metadataCache.getFileCache(dest)
        if(!settings.getFromInlineField){
            const frontmatter = cache.frontmatter
            if(frontmatter){
                settings.targetAttributes.forEach(attribute => {
                    if(Object.keys(frontmatter).includes(attribute)){
                        new_props[attribute] = frontmatter[attribute]
                    }
                })
            }
        } else {
            app.vault.cachedRead(dest).then((result: string) => {
                let foreHeadText = false
                let frontmatterStart = false
                let frontmatterEnd = false
                let inFrontmatter = false
    
                result.split('\n').map(line => {
                    if(line!="---" && !foreHeadText && !frontmatterStart){
                        foreHeadText = true
                    }
                    if(line == "---" && !foreHeadText){
                        if(!frontmatterStart){
                            frontmatterStart = true
                            inFrontmatter = true
                        } else if(!frontmatterEnd){
                            frontmatterEnd = true
                            inFrontmatter = false
                        }
                    }
                    if(inFrontmatter){
                        settings.targetAttributes.forEach(attribute => {
                            const regex = new RegExp(`${attribute}\\s*:\\s*(.*)`, 'u')
                            const regexResult = line.match(regex)
                            if(regexResult && regexResult.length > 1){
                                new_props[attribute] = regexResult[1] ? regexResult[1].replace(/^\[(.*)\]$/, "$1").trim() : ""
                            }
                        })
                    } else{
                        settings.targetAttributes.forEach(attribute => {
                            const regex = new RegExp('[_\*~\`]*'+attribute+'[_\*~`]*\s*::(.+)?', 'u')
                            const r = line.match(regex)
                            if(r && r.length > 0){
                                new_props[attribute] = r[1] ? r[1].replace(/^\[(.*)\]$/, "$1").trim() : ""
                            }
                        })
                    }
                })
               
            })
        }
        const tags = cache.tags
        if (tags && settings.targetTags) {
            new_props["tags"] = tags.map(t => t.tag).toString()
        }
        resolve(new_props) 
    })
}

function setLinkNewProps(link: HTMLElement, new_props: Record<string, string>){
    Object.keys(new_props).forEach(key => {
        link.setAttribute("data-link-"+key, new_props[key])
    })
}

function updateLinkExtraAttributes(app: App, settings: SuperchargedLinksSettings, link: HTMLElement, destName: string){
    const linkHref = link.getAttribute('href').split('#')[0];
    const dest = app.metadataCache.getFirstLinkpathDest(linkHref, destName)
    if(dest){
        fetchFrontmatterTargetAttributes(app, settings, dest).then(new_props => setLinkNewProps(link, new_props))
    }
}

export function updateDivExtraAttributes(app: App, settings: SuperchargedLinksSettings, link: HTMLElement, destName: string){
    const linkName = link.textContent;
    const dest = app.metadataCache.getFirstLinkpathDest(linkName, destName)
    if(dest){
        fetchFrontmatterTargetAttributes(app, settings, dest).then(new_props => setLinkNewProps(link, new_props))
    }
}

function updateEditLinkExtraAttributes(app: App, settings: SuperchargedLinksSettings, link: HTMLElement, destName: string){
    const linkName = link.textContent.split('|')[0].split('#')[0];
    const dest = app.metadataCache.getFirstLinkpathDest(linkName, destName)
    if(dest){
        fetchFrontmatterTargetAttributes(app, settings, dest).then(new_props => setLinkNewProps(link, new_props))
    }
}

export function updateDivLinks(app: App, settings: SuperchargedLinksSettings){
    const divs = fishAll('div.internal-link');

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

export function updateEditorLinks(app: App, settings: SuperchargedLinksSettings) {
    const internalLinks = fishAll('span.cm-hmd-internal-link');
    internalLinks.forEach((link: HTMLElement) => {
        clearExtraAttributes(link);
        updateEditLinkExtraAttributes(app, settings, link, "");
    })
}

export function updateElLinks(app: App, settings: SuperchargedLinksSettings, el: HTMLElement, ctx: MarkdownPostProcessorContext){
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
        if(leaf.view instanceof MarkdownView && leaf.view.file){
            const file: TFile = leaf.view.file;
            const cachedFile = app.metadataCache.getFileCache(file)
            if(cachedFile.links){
                cachedFile.links.forEach((link: LinkCache) => {
                    const fileName = file.path.replace(/(.*).md/, "$1")
                    const dest = app.metadataCache.getFirstLinkpathDest(link.link, fileName)
                    if(dest){
                        fetchFrontmatterTargetAttributes(app, settings, dest).then(new_props => {
                            const internalLinks = leaf.view.containerEl.querySelectorAll(`a.internal-link[href="${link.link}"]`)
                            internalLinks.forEach((internalLink: HTMLElement) => setLinkNewProps(internalLink, new_props))
                        })
                    }
                })
            }
        }
    })
}
