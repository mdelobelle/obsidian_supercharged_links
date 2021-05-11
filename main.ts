import { App, parseFrontMatterEntry, Plugin, PluginSettingTab, Setting, TFile, MarkdownPostProcessorContext, MarkdownView } from 'obsidian';

interface InternalLinksSuperchargerSettings {
	targetAttributes: Array<string>;
}

const DEFAULT_SETTINGS: InternalLinksSuperchargerSettings = {
	targetAttributes: []
}

export default class InternalLinksSupercharger extends Plugin {
	settings: InternalLinksSuperchargerSettings;

	clearLinkExtraAttributes(link: HTMLElement){
		Object.values(link.attributes).forEach(attr =>{
			if(attr.name.startsWith("data-link")){
				link.removeAttribute(attr.name)
			}
		})
	}

	fetchFrontmatterTargetAttributes(dest: TFile): Record<string, string>{
		const targetCachedFile = this.app.metadataCache.getFileCache(dest)
		let new_props: Record<string, string> = {}
		if(targetCachedFile.frontmatter){
			Object.keys(targetCachedFile.frontmatter).forEach((key: string) => {
				if(this.settings.targetAttributes.contains(key)) {
					const value = parseFrontMatterEntry(targetCachedFile.frontmatter, key)
					if(typeof value === 'string'){
						new_props[key] = value
					}
				}
			})
		}
		return new_props
	}

	setLinkNewProps(link: HTMLElement, new_props: Record<string, string>){
		Object.keys(new_props).forEach(key => {
			link.setAttribute("data-link-"+key, new_props[key])
		})
	}

	updateLinkExtraAttributes(link: HTMLElement, destName: string){
		const linkHref = link.getAttribute('href');
		const dest = this.app.metadataCache.getFirstLinkpathDest(linkHref, destName)
		if(dest){
			const new_props = this.fetchFrontmatterTargetAttributes(dest)
			this.setLinkNewProps(link, new_props)
		}
	}

	updateElLinks(el: HTMLElement, ctx: MarkdownPostProcessorContext){
		const links = el.querySelectorAll('a.internal-link');
		const destName = ctx.sourcePath.replace(/(.*).md/, "$1"); 
		links.forEach((link: HTMLElement) => {
			this.clearLinkExtraAttributes(link);
			this.updateLinkExtraAttributes(link, destName);
		})
	}

	updateVisibleLinks() {
		fishAll("a.internal-link").forEach(internalLink => this.clearLinkExtraAttributes(internalLink))
		this.app.workspace.iterateRootLeaves((leaf) => {
			if(leaf.view instanceof MarkdownView && leaf.view.file){
				const file: TFile = leaf.view.file;
				const cachedFile = this.app.metadataCache.getFileCache(file)
				if(cachedFile.links){
					cachedFile.links.forEach(link => {
						const fileName = file.path.replace(/(.*).md/, "$1")
						const dest = this.app.metadataCache.getFirstLinkpathDest(link.link, fileName)
						if(dest){
							const new_props = this.fetchFrontmatterTargetAttributes(dest)
							const internalLinks = leaf.view.containerEl.querySelectorAll(`a.internal-link[href="${link.link}"]`)
							internalLinks.forEach((internalLink: HTMLElement) => this.setLinkNewProps(internalLink, new_props))
						}
					})
				}	
			}
		})
	}

	async onload():Promise <void> {
		console.log('Internal Link Supercharger loaded');
		await this.loadSettings();
		this.addSettingTab(new InternalLinksSuperchargerSettingTab(this.app, this));
		this.registerMarkdownPostProcessor((el, ctx) => this.updateElLinks(el, ctx));
		this.app.metadataCache.on('changed', (_file) => this.updateVisibleLinks());
	}

	onunload() {
		console.log('Internal Link Supercharger unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class InternalLinksSuperchargerSettingTab extends PluginSettingTab {
	plugin: InternalLinksSupercharger;

	constructor(app: App, plugin: InternalLinksSupercharger) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for Internal Links supercharger.'});

		new Setting(containerEl)
			.setName('Target Attributes')
			.setDesc('Frontmatter attributes to target')
			.addText(text => text
				.setPlaceholder('Enter attributes as string, comma separated')
				.setValue(this.plugin.settings.targetAttributes.join(', '))
				.onChange(async (value) => {
					this.plugin.settings.targetAttributes = value.replace(/\s/g,'').split(',');
					await this.plugin.saveSettings();
				}));
	}
}
