import {App, Modal, DropdownComponent, TFile, ButtonComponent} from "obsidian"
import Field from "src/Field"
import linkContextMenu from "src/linkContextMenu/linkContextMenu"
import FieldSetting from "src/settings/FieldSetting"

export default class valueToggleModal extends Modal {
    app: App
    file: TFile
    name: string
    value: string
    settings: Field
    newValue: string

    constructor(app: App, file: TFile, name: string, value: string, settings: Field){
        super(app)
        this.app = app
        this.file = file
        this.name = name
        this.value = value
        this.settings = settings
        this.newValue = null
    }

    onOpen(){
        const inputDiv = this.contentEl.createDiv({
            cls: "frontmatter-modal-value"
        })
        this.buildInputEl(inputDiv)
    }

    buildInputEl(inputDiv: HTMLDivElement): void{
        const selectEl = new DropdownComponent(inputDiv)
        selectEl.selectEl.addClass("frontmatter-select")
        const values = this.settings.values
        selectEl.addOption("","--Empty--")
        Object.keys(values).forEach(key => {
            selectEl.addOption(values[key], values[key])
        });
        if(Object.values(values).includes(this.value)){
            selectEl.setValue(this.value)
        }
        FieldSetting.getValuesListFromNote(this.settings.valuesListNotePath, this.app).then(listNoteValues => {
            listNoteValues.forEach(value => selectEl.addOption(value, value))
            if(listNoteValues.includes(this.value)){
                selectEl.setValue(this.value)
            }
            selectEl.onChange(value => this.newValue = value != "--Empty--" ? value : "")
            const submitButton = new ButtonComponent(inputDiv)
            submitButton.setTooltip("Save")
            .setIcon("checkmark")
            .onClick(async () => {
                if(this.newValue || this.newValue == ""){
                    linkContextMenu.replaceFrontmatterAttribute(this.app, this.file, this.name, this.newValue)
                }
                this.close()
            })
        })
        
    }
}