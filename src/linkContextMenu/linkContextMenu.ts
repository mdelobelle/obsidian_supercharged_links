import {App, Modal, Menu, TFile, TAbstractFile, MenuItem} from "obsidian"
import SuperchargedLinks from "main"
import valueMultiSelectModal from "src/linkContextMenu/valueMultiSelectModal"
import valueTextInputModal from "src/linkContextMenu/valueTextInputModal"
import valueToggleModal from "src/linkContextMenu/valueToggleModal"
import valueSelectModal from "src/linkContextMenu/valueSelectModal"
import Field from "src/Field"
import chooseSectionModal from "./chooseSectionModal"

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
                if(this.plugin.settings.displayFieldsInContextMenu && (
					source === "link-context-menu" || 
					source === "calendar-context-menu" || 
					source === 'pane-more-options' ||
					source === 'file-explorer-context-menu')){
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
			const filteredAttributes: Record<string, string> = {}
			Object.keys(attributes).forEach(key => {
				if(!this.plugin.settings.globallyIgnoredFields.includes(key)){
					filteredAttributes[key] = attributes[key]
				}
			})
			menu.addSeparator()
			this.createExtraOptionsListForFrontmatter(filteredAttributes, menu).then(() => {
				this.createExtraOptionsListForInlineFields(this.file, menu).then(() => {
					menu.addSeparator()
					this.addSectionSelectModalOption(this.plugin, menu)
				})
			})
		} else {
			this.createExtraOptionsListForInlineFields(this.file, menu).then(() => {
				menu.addSeparator()
				this.addSectionSelectModalOption(this.plugin, menu)
			})
		}
		
	}

	async createExtraOptionsListForInlineFields(file:TFile, menu: Menu):Promise<void>{
		let attributes: Record<string, string> = {}
		const regex = new RegExp(/[_\*~`]*([0-9\w\p{Letter}\p{Emoji_Presentation}][-0-9\w\p{Letter}\p{Emoji_Presentation}\s]*)[_\*~`]*\s*::(.+)?/u)
		this.plugin.app.vault.read(file).then((result: string) => {
			result.split('\n').map(line => {
				const regexResult = line.match(regex)
				if(regexResult 
					&& regexResult.length > 0 
					&& !this.plugin.settings.globallyIgnoredFields.includes(regexResult[1].trim())){
					attributes[regexResult[1].trim()] = regexResult.length > 1 && regexResult[2] ? regexResult[2].trim() : ""
				}
			})
			if(Object.keys(attributes).length > 0){
				menu.addSeparator()
				this.createExtraOptionsList(attributes, menu)
			}
		})
	}

	async createExtraOptionsListForFrontmatter(attributes: Record<string, string>, menu: Menu){
		this.createExtraOptionsList(attributes, menu)
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
			} else if(isBoolean(value) || /true/i.test(value) || /false/i.test(value)){
				let toBooleanValue: boolean
				if(isBoolean(value)){
					toBooleanValue = value
				} else if(/true/i.test(value)){
					toBooleanValue = true
				} else if(/false/i.test(value)){
					toBooleanValue = false
				}
				this.addToggleMenuOption(menu, key, toBooleanValue)
			} else {
				this.addTextInputMenuOption(menu, key, value ? value.toString() : "")
			}
		});
	}

	addSectionSelectModalOption(plugin: SuperchargedLinks, menu: Menu): void{
		const modal = new chooseSectionModal(this.plugin, this.file)
		menu.addItem((item) => {
			item.setIcon("pencil")
			item.setTitle("Add field at section...")
			item.onClick((evt: MouseEvent) => {
				modal.open()
			})
		})
	}

	addCycleMenuOption(menu: Menu, name: string, value: string, propertySettings: Field): void{
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

	addMultiMenuOption(menu: Menu, name: string, value: string, propertySettings: Field): void{
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

	addSelectMenuOption(menu: Menu, name: string, value: string, propertySettings: Field): void{
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

	getPropertySettings(propertyName: string): Field{
		const matchingSettings = this.plugin.settings.presetFields.filter(p => p.name == propertyName)
		if(matchingSettings.length > 0){
			return matchingSettings[0]
		}
	}

	static async replaceFrontmatterAttribute(app: App, file: TFile, attribute: string, input: string): Promise <void>{
		app.vault.read(file).then((result: string) => {
			let newContent:Array<string> = []
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
					const regex = new RegExp(`${attribute}:`, 'u')
					const regexResult = line.match(regex)
					if(regexResult && regexResult.length > 0){
						const inputArray = input ? input.replace(/(\,\s+)/g, ',').split(',') : [""]
						const newValue = inputArray.length == 1 ? inputArray[0] : `[${inputArray.join(', ')}]`
						newContent.push(`${attribute}: ${newValue}`)
					} else {
						newContent.push(`${line}`)
					}
				} else {
					const regex = new RegExp(`([_\*~\`]*)${attribute}([_\*~\`]*)(\\s*)::`, 'u')
					const r = line.match(regex)
					if(r && r.length > 0){
						const inputArray = input ? input.replace(/(\,\s+)/g, ',').split(',') : [""]
						const newValue = inputArray.length == 1 ? inputArray[0] : `${inputArray.join(', ')}`
						newContent.push(`${r[1]}${attribute}${r[2]}${r[3]}:: ${newValue}`)
					} else {
						newContent.push(line)
					}	
				}
			})
			app.vault.modify(file, newContent.join('\n'))
		})
	}
}

export default linkContextMenu