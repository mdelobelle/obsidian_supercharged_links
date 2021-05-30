import SuperchargedLinks from "main"
import { App, TFile, Menu } from "obsidian"
import valueMultiSelectModal from "src/optionModals/valueMultiSelectModal"
import valueTextInputModal from "src/optionModals/valueTextInputModal"
import valueToggleModal from "src/optionModals/valueToggleModal"
import valueSelectModal from "src/optionModals/valueSelectModal"
import Field from "src/Field"
import chooseSectionModal from "../optionModals/chooseSectionModal"
import SelectModal from "src/optionModals/SelectModal"
import {createFileClass} from "src/fileClass/FileClass"
import { replaceValues } from "./replaceValues"

function isMenu(category: Menu | SelectModal): category is Menu {
    return (category as Menu).addItem !== undefined
}

function isSelect(category: Menu | SelectModal): category is SelectModal {
    return (category as SelectModal).modals !== undefined
}

export default class OptionsList{
    app: App
    file: TFile
    plugin: SuperchargedLinks
    path: string
    category: Menu | SelectModal
    private modals: Record<string, any>

    constructor(plugin: SuperchargedLinks, file: TFile, category: Menu | SelectModal){
        this.file = file
        this.plugin = plugin
        this.category = category
        this.modals = {}
    }

	createExtraOptionList(){
		const cache = this.plugin.app.metadataCache.getCache(this.file.path)
		if(cache.frontmatter){
			const {position, ...attributes} = cache.frontmatter
			Object.keys(attributes).forEach(key => {
				if(this.plugin.settings.globallyIgnoredFields.includes(key)){
					delete attributes[key]
				}
			})
			if(isMenu(this.category)){this.category.addSeparator()}
			let fileClassForFields = false
			let fileClassFields: string[] = []
			if(Object.keys(attributes).includes('fileClass')){
				const fileClass = attributes['fileClass']
				createFileClass(this.plugin, fileClass).then(fileClass => {
					fileClassFields = fileClass.attributes.map(attr => attr.name)
					fileClassForFields = true
					Object.keys(attributes).forEach(key => {
						if(!fileClassFields.includes(key) && key != 'fileClass'){
							delete attributes[key]
						}
					})
					this.createExtraOptionsListForFrontmatter(attributes, this.category).then(() => {
						this.createExtraOptionsListForInlineFields(this.file, this.category, fileClassForFields, fileClassFields).then(() => {
							if(isMenu(this.category)){this.category.addSeparator()}
							this.addSectionSelectModalOption(this.plugin, this.category)
						})
					})
				}).catch(() => {
					this.createExtraOptionsListForFrontmatter(attributes, this.category).then(() => {
						this.createExtraOptionsListForInlineFields(this.file, this.category).then(() => {
							if(isMenu(this.category)){this.category.addSeparator()}
							this.addSectionSelectModalOption(this.plugin, this.category)
						})
					})
				})
			} else {
				this.createExtraOptionsListForFrontmatter(attributes, this.category).then(() => {
					this.createExtraOptionsListForInlineFields(this.file, this.category).then(() => {
						if(isMenu(this.category)){this.category.addSeparator()}
						this.addSectionSelectModalOption(this.plugin, this.category)
					})
				})
			}
		} else {
			this.createExtraOptionsListForInlineFields(this.file, this.category).then(() => {
				if(isMenu(this.category)){this.category.addSeparator()}
				this.addSectionSelectModalOption(this.plugin, this.category)
			})
		}
		
	}

	async createExtraOptionsListForInlineFields(file:TFile, category: Menu | SelectModal, fileClassForFields: boolean = false, fileClassFields: string[] = []):Promise<void>{
		return new Promise((resolve, reject) => {
			let attributes: Record<string, string> = {}
			const regex = new RegExp(/[_\*~`]*([0-9\w\p{Letter}\p{Emoji_Presentation}][-0-9\w\p{Letter}\p{Emoji_Presentation}\s]*)[_\*~`]*\s*::(.+)?/u)
			this.plugin.app.vault.read(file).then((result: string) => {
				result.split('\n').map(line => {
					const regexResult = line.match(regex)
					if(regexResult 
						&& regexResult.length > 0 
						&& !this.plugin.settings.globallyIgnoredFields.includes(regexResult[1].trim())){
						if(fileClassForFields){
							if(fileClassFields.includes(regexResult[1].trim())){
								attributes[regexResult[1].trim()] = regexResult.length > 1 && regexResult[2] ? regexResult[2].trim() : ""
							}
						}else{
							attributes[regexResult[1].trim()] = regexResult.length > 1 && regexResult[2] ? regexResult[2].trim() : ""
						}
					}
				})
				if(Object.keys(attributes).length > 0){
					if(isMenu(this.category)){this.category.addSeparator()}
					this.buildExtraOptionsList(attributes, category)
				}
				resolve()
			})
		})
	}

	async createExtraOptionsListForFrontmatter(attributes: Record<string, string>, category: Menu | SelectModal){
		this.buildExtraOptionsList(attributes, category)
	}

	buildExtraOptionsList(attributes: Record<string, string>, category: Menu | SelectModal) {
		Object.keys(attributes).forEach((key: string) => {
			const value = attributes[key]
			const propertySettings = this.getPropertySettings(key)
			if(propertySettings && propertySettings.values){
				if(propertySettings.isCycle){
					this.addCycleMenuOption(category, key, value, propertySettings)
				} else if(propertySettings.isMulti){
					this.addMultiMenuOption(category, key, value, propertySettings)
				} else {
					this.addSelectMenuOption(category, key, value, propertySettings)
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
				this.addToggleMenuOption(category, key, toBooleanValue)
			} else {
				this.addTextInputMenuOption(category, key, value ? value.toString() : "")
			}
		});
	}

	addSectionSelectModalOption(plugin: SuperchargedLinks, category: Menu | SelectModal): void{
		const modal = new chooseSectionModal(this.plugin, this.file)
        if(isMenu(this.category)){
            this.category.addItem((item) => {
                item.setIcon("pencil")
                item.setTitle("Add field at section...")
                item.onClick((evt: MouseEvent) => {
                    modal.open()
                })
            })
        } else if(isSelect(this.category)){
            this.category.addOption("add_field_at_section", "Add field at section...")
            this.category.modals["add_field_at_section"] = () => modal.open()
        }
	}

	addCycleMenuOption(category: Menu | SelectModal, name: string, value: string, propertySettings: Field): void{
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
        if(isMenu(this.category)){
            this.category.addItem((item) => {
                item.setTitle(`${name} : ${value} ▷ ${nextValue}`)
                item.setIcon('switch')
                item.onClick((evt: MouseEvent) => {
                    replaceValues(this.plugin.app, this.file, name, nextValue)
                })
            })
        } else if(isSelect(this.category)){
            this.category.addOption(`${name}_${value}_${nextValue}`, `${name} : ${value} ▷ ${nextValue}`)
            this.category.modals[`${name}_${value}_${nextValue}`] = () => 
            replaceValues(this.plugin.app, this.file, name, nextValue)
        }
	}

	addMultiMenuOption(category: Menu | SelectModal, name: string, value: string, propertySettings: Field): void{
		const modal = new valueMultiSelectModal(this.plugin.app, this.file, name, value, propertySettings)
		modal.titleEl.setText("Select values")
        if(isMenu(this.category)){
            this.category.addItem((item) => {
                item.setTitle(`Update ${name}`)
                item.setIcon('bullet-list')
                item.onClick((evt: MouseEvent) => {
                    modal.open()
                })
            })
       } else if(isSelect(this.category)){
            this.category.addOption(`update_${name}`, `Update ${name}`)
            this.category.modals[`update_${name}`] = () => modal.open()
       }
	}

	addSelectMenuOption(category: Menu | SelectModal, name: string, value: string, propertySettings: Field): void{
		const modal = new valueSelectModal(this.plugin.app, this.file, name, value, propertySettings)
		modal.titleEl.setText("Select value")
        if(isMenu(this.category)){
            this.category.addItem((item) => {
                item.setTitle(`Update ${name}`)
                item.setIcon('right-triangle')
                item.onClick((evt: MouseEvent) => modal.open())
            })
        } else if(isSelect(this.category)){
            this.category.addOption(`update_${name}`, `Update ${name}`)
            this.category.modals[`update_${name}`] = () => modal.open()
        }
	}

	addToggleMenuOption(category: Menu | SelectModal, name: string, value: boolean): void{
		const modal = new valueToggleModal(this.plugin.app, this.file, name, value)
		modal.titleEl.setText(`Change Value for ${name}`)
        if(isMenu(this.category)){
            this.category.addItem((item) => {
                item.setTitle(`Update ${name}`)
                item.setIcon('checkmark')
                item.onClick((evt: MouseEvent) => {modal.open()})
            })
        } else if(isSelect(this.category)){
            this.category.addOption(`update_${name}`, `Update ${name}`)
            this.category.modals[`update_${name}`] = () => modal.open()
        }
	}

	addTextInputMenuOption(category: Menu | SelectModal, name: string, value: string): void{
		const modal = new valueTextInputModal(this.plugin.app, this.file, name, value)
		modal.titleEl.setText(`Change Value for ${name}`)
        if(isMenu(this.category)){
            this.category.addItem((item) => {
                item.setTitle(`Update ${name}`)
                item.setIcon('pencil')
                item.onClick((evt: MouseEvent) => modal.open())
            })
        } else if(isSelect(this.category)){
            this.category.addOption(`update_${name}`, `Update ${name}`)
            this.category.modals[`update_${name}`] = () => modal.open()
        }
	}

	getPropertySettings(propertyName: string): Field{
		const matchingSettings = this.plugin.settings.presetFields.filter(p => p.name == propertyName)
		if(matchingSettings.length > 0){
			return matchingSettings[0]
		}
	}
}