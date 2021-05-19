import {App, Modal, Menu, TFile, TAbstractFile, MenuItem} from "obsidian"
import SuperchargedLinks from "main"
import valueMultiSelectModal from "src/linkContextMenu/valueMultiSelectModal"
import valueTextInputModal from "src/linkContextMenu/valueTextInputModal"
import valueToggleModal from "src/linkContextMenu/valueToggleModal"
import valueSelectModal from "src/linkContextMenu/valueSelectModal"
import FrontMatterProperty from "src/FrontMatterProperty"

class linkContextMenu {
    plugin: SuperchargedLinks
	file: TFile
    constructor(plugin: SuperchargedLinks){
        this.plugin = plugin
        this.createContextMenu()
        
    }

	createContextMenu(): void{
		this.plugin.registerEvent(
            this.plugin.app.workspace.on('file-menu', (menu, abstractFile, source) => {
                if(source=='link-context-menu'){
					const files = this.plugin.app.vault.getMarkdownFiles().filter(mdFile => mdFile.path == abstractFile.path)
					if(files.length > 0){
						const file = files[0]
						this.file = file
						this.getTargetFileAndCreateExtraOptionList(menu, abstractFile)
					}
				}
            })
		);
	}

	getTargetFileAndCreateExtraOptionList(menu: Menu, abstractFile: TAbstractFile){
		const cache = this.plugin.app.metadataCache.getCache(abstractFile.path)
		if(cache.frontmatter){
			const {position, ...attributes} = cache.frontmatter
			menu.addSeparator()
			this.createExtraOptionsList(attributes, menu)
		}
		
	}

	createExtraOptionsList(attributes: Record<string, string>, menu: Menu) {
		Object.keys(attributes).forEach((key: string) => {
			const value = attributes[key]
			const propertySettings = this.getPropertySettings(key)
			if(propertySettings && propertySettings.values){
				if(propertySettings.isCycle){
					this.addCycleMenuOption(menu, key, value, propertySettings)
				} else if(propertySettings.isMulti){
					this.addMultiMenuOption(menu, key, value, propertySettings)
				} else {
					this.addSelectMenuOption(menu, key, value, propertySettings)
				}
			} else if(isBoolean(value)){
				this.addToggleMenuOption(menu, key, value)
			} else {
				this.addTextInputMenuOption(menu, key, value)
			}
		});
	}

	addCycleMenuOption(menu: Menu, name: string, value: string, propertySettings: FrontMatterProperty): void{
		const values = propertySettings.values
		const keys = Object.keys(values)
		const keyForValue = keys.find(key => values[key] === value)
		let nextValue: string
		if(keyForValue){
			const nextKey = keys[(keys.indexOf(keyForValue)+1) % keys.length]
			nextValue = values[nextKey]
		} else {
			nextValue = values[Object.keys(values)[0]]
		}
		menu.addItem((item) => {
			item.setTitle(`${name} : ${value} ▷ ${nextValue}`)
			item.setIcon('switch')
			item.onClick((evt: MouseEvent) => {
				linkContextMenu.replaceFrontmatterAttribute(this.plugin.app, this.file, name, nextValue)
			})
		})
	}

	addMultiMenuOption(menu: Menu, name: string, value: string, propertySettings: FrontMatterProperty): void{
		const modal = new valueMultiSelectModal(this.plugin.app, this.file, name, value, propertySettings)
		modal.titleEl.setText("Select values")
		menu.addItem((item) => {
			item.setTitle(`Update ${name}`)
			item.setIcon('bullet-list')
			item.onClick((evt: MouseEvent) => {
				modal.open()
			})
		})
	}

	addSelectMenuOption(menu: Menu, name: string, value: string, propertySettings: FrontMatterProperty): void{
		const modal = new valueSelectModal(this.plugin.app, this.file, name, value, propertySettings)
		modal.titleEl.setText("Select value")
		menu.addItem((item) => {
			item.setTitle(`Update ${name}`)
			item.setIcon('right-triangle')
			item.onClick((evt: MouseEvent) => modal.open())
		})
	}

	addToggleMenuOption(menu: Menu, name: string, value: boolean): void{
		const modal = new valueToggleModal(this.plugin.app, this.file, name, value)
		modal.titleEl.setText(`Change Value for ${name}`)
		menu.addItem((item) => {
			item.setTitle(`Update ${name}`)
			item.setIcon('checkmark')
			item.onClick((evt: MouseEvent) => {modal.open()})
		})
	}

	addTextInputMenuOption(menu: Menu, name: string, value: string): void{
		const modal = new valueTextInputModal(this.plugin.app, this.file, name, value)
		modal.titleEl.setText(`Change Value for ${name}`)
		menu.addItem((item) => {
			item.setTitle(`Update ${name}`)
			item.setIcon('pencil')
			item.onClick((evt: MouseEvent) => modal.open())
		})
	}

	getPropertySettings(propertyName: string): FrontMatterProperty{
		const matchingSettings = this.plugin.settings.presetFrontmatterProperties.filter(p => p.name == propertyName)
		if(matchingSettings.length > 0){
			return matchingSettings[0]
		}
	}

	static async replaceFrontmatterAttribute(app: App, file: TFile, attribute: string, input: string): Promise <void>{
		app.vault.read(file).then((result: string) => {
			let newContent:Array<string> = []
			result.split('\n').map(line => {
				const regex = new RegExp(`${attribute}:`)
				const regexResult = line.match(regex)
				if(regexResult && regexResult.length > 0){
					const inputArray = input ? input.replace(/(\,\s+)/g, ',').split(',') : [""]
					const newValue = inputArray.length == 1 ? inputArray[0] : `[${inputArray.join(', ')}]`
					newContent.push(`${attribute}: ${newValue}`)
				} else {
					newContent.push(`${line}`)
				}
				app.vault.modify(file, newContent.join('\n'))
			})
		})
	}
}

export default linkContextMenu