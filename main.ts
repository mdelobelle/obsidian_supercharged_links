import { privateDecrypt } from 'crypto';
import { App, Modal, Notice, parseFrontMatterEntry, Plugin, PluginSettingTab, Setting, ViewState, TFile, WorkspaceLeaf } from 'obsidian';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}



export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	coreAttributes = ["data-href", "href", "class", "target", "rel"]

	clearExtraAttributes = () => {
		fishAll("a.internal-link").forEach(internalLink => {
			Object.values(internalLink.attributes).forEach(attr =>{
				if(!this.coreAttributes.contains(attr.name)){
					internalLink.removeAttribute(attr.name)
				}
			})
		})
	}

	updateActiveLeaves = () => {
		this.app.workspace.iterateRootLeaves((leaf) => {
			const file: TFile = leaf.view.file;
			const cachedFile = this.app.metadataCache.getFileCache(file)
			if(cachedFile.links){
				cachedFile.links.forEach(link => {
					var new_props: Object = {}
					const dest = this.app.metadataCache.getFirstLinkpathDest(link.link, file.basename)
					if(dest){
						const targetCachedFile = this.app.metadataCache.getFileCache(dest)
						if(targetCachedFile.frontmatter){
							Object.keys(targetCachedFile.frontmatter).forEach((key: string) => {
								if(key != "position") {
									new_props[key] = parseFrontMatterEntry(targetCachedFile.frontmatter, key)
								}
							})
						}
						leaf.view.containerEl.querySelectorAll(`a.internal-link[href="${link.link}"]`).forEach((internalLink) => {
							Object.keys(new_props).forEach(key => {
								
								internalLink.setAttribute(key, new_props[key])
							})
						})
					}
				})
			}
			
		})
	}

	updateLinks = () => {
		this.clearExtraAttributes()
		this.updateActiveLeaves()
	}

	async onload() {
		console.log('loading plugin');
		await this.loadSettings();

		this.app.workspace.on('active-leaf-change', () => {
			this.updateLinks()
		})

		this.app.metadataCache.on('changed', (_file) => {
			this.updateLinks()
		})

	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

