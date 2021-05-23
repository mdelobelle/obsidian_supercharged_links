import {App, Modal, DropdownComponent, TFile} from "obsidian"
import SuperchargedLinks from "main"
import addNewFieldModal from "./addNewFieldModal"

export default class fieldSelectModal extends Modal {

    lineNumber: number
    line: string
    plugin: SuperchargedLinks
    file: TFile
    inFrontmatter: boolean
    constructor(plugin: SuperchargedLinks, file:TFile, lineNumber: number, line: string, inFrontmatter: boolean){
        super(plugin.app)
        this.line = line
        this.lineNumber = lineNumber
        this.plugin = plugin
        this.file = file
        this.inFrontmatter = inFrontmatter
    }

    onOpen(){
        this.titleEl.setText(`Insert field after > ${this.line.substring(0, 20)}${this.line.length>20 ? "..." : ""}`)
        const container = this.contentEl.createDiv()
        const settingsDropdownContainer = container.createDiv()
        const settingsSelector = new DropdownComponent(settingsDropdownContainer)
        settingsSelector.addOption("---", "Choose Field")
        settingsSelector.addOption("++New", "New")
        this.plugin.settings.presetFields.forEach(setting => {
            settingsSelector.addOption(setting.name, setting.name)
        })
        settingsSelector.onChange(value => {
            if(value == "++New"){
                const newFieldModal = new addNewFieldModal(this.plugin, this.lineNumber, this.file, this.inFrontmatter)
                newFieldModal.open()
                this.close()
            } else {
                return
            }
        })
    }
}