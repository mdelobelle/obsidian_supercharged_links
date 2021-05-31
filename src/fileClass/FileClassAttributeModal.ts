import {App, DropdownComponent, Modal, TextComponent, ButtonComponent, ExtraButtonComponent} from "obsidian"
import FileClassAttribute from "src/fileClass/fileClassAttribute"
import {FileClass} from "src/fileClass/fileClass"
import { stringify } from "querystring"

export default class FileClassAttributeModal extends Modal {

    attr: FileClassAttribute
    fileClass: FileClass
    type: string = "input"
    options: string[] = []

    constructor(app: App, fileClass: FileClass, attr: FileClassAttribute){
        super(app)
        this.attr = attr
        this.fileClass = fileClass
    }

    onOpen(){
        //title
        this.titleEl.setText(`Manage ${this.attr.name}`)
        
        //header for select
        const typeSelectHeader = this.contentEl.createDiv()
        const attrLine = typeSelectHeader.createEl("div")
        attrLine.createEl("strong").setText(`<${this.attr.name}>`)
        attrLine.append(" fields in files with:")
        String(`---\nfileClass: ${this.fileClass.name}\n...\n---`).split('\n').forEach(line => {
            typeSelectHeader.createEl("div", "yaml-frontmatter-red").setText(line)
        })

        // type select
        const typeSelectContainer = this.contentEl.createDiv({cls: 'frontmatter-value-selector-container'})
        const typeSelectLabel = typeSelectContainer.createDiv({cls: 'frontmatter-value-selector-inline-label'})
        typeSelectLabel.setText("will: ")
        const typeSelectDropDown = typeSelectContainer.createDiv({cls: 'frontmatter-value-selector-toggler'})
        const typeSelect = new DropdownComponent(typeSelectDropDown)
        Object.keys(this.attr.types).forEach(key => {
            typeSelect.addOption(key, this.attr.types[key])
        })

        // options input
        const optionsInputContainer = this.contentEl.createDiv({cls: 'frontmatter-value-selector-container'})
        const optionsInputLabel = optionsInputContainer.createDiv({cls: 'frontmatter-value-selector-inline-label'})
        optionsInputLabel.setText("Values")
        const optionsInput = new TextComponent(optionsInputContainer)
        optionsInput.setPlaceholder("insert values, comma separated")
        optionsInputContainer.hide()

        // event handlers
        typeSelect.onChange(type => type == "input" ? optionsInputContainer.hide() : optionsInputContainer.show())
        optionsInput.onChange(value => this.options = value.split(","))

        // footer buttons
        const footer = this.contentEl.createDiv({cls: "frontmatter-value-grid-footer"})
        const saveButton = new ButtonComponent(footer)
        saveButton.setIcon("checkmark")
        saveButton.onClick(() => {
            console.log(this.type,":", this.options)
            /* TODO: Change value of the attribute in the fileClass when clicking save */
            this.close()
        })
        const cancelButton = new ExtraButtonComponent(footer)
        cancelButton.setIcon("cross")
        cancelButton.onClick(() => this.close())
    }
}