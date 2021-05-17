import {Plugin} from 'obsidian';
import FrontMatterPropertyUpdateModal from "src/FrontMatterPropertyUpdateModal"
import SuperchargedLinksSettingTab from "src/settings/SuperchargedLinksSettingTab"
import {updateElLinks, updateVisibleLinks} from "src/linkAttributes/linkAttributes"
import {SuperchargedLinksSettings, DEFAULT_SETTINGS} from "src/settings/SuperchargedLinksSettings"
import FrontMatterProperty from 'src/FrontMatterProperty';

export default class SuperchargedLinks extends Plugin {
	settings: SuperchargedLinksSettings;
	initialProperties: Array<FrontMatterProperty> = []
	settingTab: SuperchargedLinksSettingTab

	extendLinkMenu(){
		this.registerEvent(
            this.app.workspace.on('file-menu', (menu, abstractFile, source) => {
                if(source=='link-context-menu'){
					const files = this.app.vault.getMarkdownFiles().filter(mdFile => mdFile.path == abstractFile.path)
					if(files.length > 0){
						const file = files[0]
						const cache = this.app.metadataCache.getCache(abstractFile.path)
						if(cache.frontmatter){
							const {position, ...attributes} = cache.frontmatter
							menu.addSeparator()
							Object.keys(attributes).forEach((key: string) => {
								menu.addItem((item) => {
									item.setTitle(`Update ${key}`)
									item.setIcon('pencil')
									item.onClick((evt: MouseEvent) => {
										new FrontMatterPropertyUpdateModal(this.app, file, key, attributes[key]).open();
									})
								})
							});
						}
					}
				}
            })
		);
	}

	async onload():Promise <void> {
		console.log('Supercharged links loaded');
		await this.loadSettings();

		this.settings.presetFrontmatterProperties.forEach(prop => {
			const property = new FrontMatterProperty("", {}, "")
			Object.assign(property, prop)
			this.initialProperties.push(property)
		}) 
		this.addSettingTab(new SuperchargedLinksSettingTab(this.app, this));
		this.registerMarkdownPostProcessor((el, ctx) => updateElLinks(this.app, this.settings, el, ctx));
		this.app.metadataCache.on('changed', (_file) => updateVisibleLinks(this.app, this.settings));
		this.extendLinkMenu()
	}

	onunload() {
		console.log('Supercharged links unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		this.settings.presetFrontmatterProperties = this.initialProperties
		await this.saveData(this.settings);
	}
}