import {App, Modal, ToggleComponent, TFile, ButtonComponent, ExtraButtonComponent, parseFrontMatterStringArray} from "obsidian"
import FrontMatterProperty from "src/FrontMatterProperty"
import linkContextMenu from "src/linkContextMenu/linkContextMenu"

export default class valueMultiSelectModal extends Modal {
    app: App
    file: TFile
    name: string
    settings: FrontMatterProperty
    values: Array<string>

    constructor(app: App, file: TFile, name: string, initialValues: string, settings: FrontMatterProperty){
        super(app)
        this.app = app
        this.file = file
        this.name = name
        this.settings = settings
        this.values = initialValues ? initialValues.toString().split(",") : []
    }

    onOpen(){
        const valueGrid = this.contentEl.createDiv({
            cls: "frontmatter-values-grid"
        })
        Object.keys(this.settings.values).forEach(key => {

            const presetValue = this.settings.values[key]
            const valueSelectorContainer = valueGrid.createDiv({
                cls: "frontmatter-value-selector-container"
            })
            const valueTogglerContainer = valueSelectorContainer.createDiv({
                cls: "frontmatter-value-selector-toggler"
            })
            const valueToggler = new ToggleComponent(valueTogglerContainer)
            this.values.forEach(value => {
                if (value == presetValue){
                    valueToggler.setValue(true)
                }
            })
            valueToggler.onChange(value => {
                if(value && !this.values.includes(presetValue)){
                    this.values.push(presetValue)
                }
                if(!value){
                    this.values.remove(presetValue)
                }
            })
            const valueLabel = valueSelectorContainer.createDiv({
                cls: "frontmatter-value-selector-label"
            })
            valueLabel.setText(presetValue)
            
        })
        const footer = this.contentEl.createDiv({
            cls: "frontmatter-value-grid-footer"
        })
        const saveButton = new ButtonComponent(footer)
        saveButton.setIcon("checkmark")
        saveButton.onClick(() => {
            linkContextMenu.replaceFrontmatterAttribute(this.app, this.file, this.name, this.values.join(","))
            this.close()
        })
        const cancelButton = new ExtraButtonComponent(footer)
        cancelButton.setIcon("cross")
        cancelButton.onClick(() => this.close())

    }
}