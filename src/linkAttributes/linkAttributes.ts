import {App, TFile, parseFrontMatterEntry, MarkdownPostProcessorContext, MarkdownView, LinkCache} from "obsidian"
import {SuperchargedLinksSettings} from "src/settings/SuperchargedLinksSettings"

function clearLinkExtraAttributes(link: HTMLElement){
    Object.values(link.attributes).forEach(attr =>{
        if(attr.name.startsWith("data-link")){
            link.removeAttribute(attr.name)
        }
    })
}

function fetchFrontmatterTargetAttributes(app: App, settings: SuperchargedLinksSettings, dest: TFile): Promise<Record<string, string>>{
    let new_props: Record<string, string> = {}
    return new Promise((resolve, reject) => {
        if(!settings.getFromInlineField){
            const frontmatter = app.metadataCache.getFileCache(dest).frontmatter
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
                                const value = regexResult[1] ? regexResult[1].replace(/^\[(.*)\]$/,"$1").trim() : ""
                                new_props[attribute] = value
                            }
                        })
                    } else{
                        settings.targetAttributes.forEach(attribute => {
                            const regex = new RegExp('[_\*~\`]*'+attribute+'[_\*~`]*\s*::(.+)?', 'u')
                            const r = line.match(regex)
                            if(r && r.length > 0){
                                const value = r[1] ? r[1].replace(/^\[(.*)\]$/,"$1").trim() : ""
                                new_props[attribute] = value
                            }
                        })
                    }
                })
               
            })
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
    const linkHref = link.getAttribute('href');
    const dest = app.metadataCache.getFirstLinkpathDest(linkHref, destName)
    if(dest){
        fetchFrontmatterTargetAttributes(app, settings, dest).then(new_props => setLinkNewProps(link, new_props))
    }
}

export function updateElLinks(app: App, settings: SuperchargedLinksSettings, el: HTMLElement, ctx: MarkdownPostProcessorContext){
    const links = el.querySelectorAll('a.internal-link');
    const destName = ctx.sourcePath.replace(/(.*).md/, "$1"); 
    links.forEach((link: HTMLElement) => {
        clearLinkExtraAttributes(link);
        updateLinkExtraAttributes(app, settings, link, destName);
    })
}

export function updateVisibleLinks(app: App, settings: SuperchargedLinksSettings) {
    fishAll("a.internal-link").forEach(internalLink => clearLinkExtraAttributes(internalLink))
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
