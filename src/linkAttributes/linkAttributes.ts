import {App, TFile, parseFrontMatterEntry, MarkdownPostProcessorContext, MarkdownView, LinkCache} from "obsidian"
import {SuperchargedLinksSettings} from "src/settings/SuperchargedLinksSettings"

function clearLinkExtraAttributes(link: HTMLElement){
    Object.values(link.attributes).forEach(attr =>{
        if(attr.name.startsWith("data-link")){
            link.removeAttribute(attr.name)
        }
    })
}

function fetchFrontmatterTargetAttributes(app: App, settings: SuperchargedLinksSettings, dest: TFile): Record<string, string>{
    const targetCachedFile = app.metadataCache.getFileCache(dest)
    let new_props: Record<string, string> = {}
    if(targetCachedFile.frontmatter){
        Object.keys(targetCachedFile.frontmatter).forEach((key: string) => {
            if(settings.targetAttributes.contains(key)) {
                const value = parseFrontMatterEntry(targetCachedFile.frontmatter, key)
                if(typeof value === 'string'){
                    new_props[key] = value
                } else if (typeof value === 'boolean' || typeof value === 'number'){
                    new_props[key] = value.toString()
                } else if (Array.isArray(value)) {
                    new_props[key] = value.join(' ')
                }
            }
        })
    }
    return new_props
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
        const new_props = fetchFrontmatterTargetAttributes(app, settings, dest)
        setLinkNewProps(link, new_props)
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
                        const new_props = fetchFrontmatterTargetAttributes(app, settings, dest)
                        const internalLinks = leaf.view.containerEl.querySelectorAll(`a.internal-link[href="${link.link}"]`)
                        internalLinks.forEach((internalLink: HTMLElement) => setLinkNewProps(internalLink, new_props))
                    }
                })
            }	
        }
    })
}