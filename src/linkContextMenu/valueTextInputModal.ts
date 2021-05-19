import {App, Modal, TextComponent, TFile} from "obsidian"
import linkContextMenu from "src/linkContextMenu/linkContextMenu"

export default class valueTextInputModal extends Modal {
    app: App
    file: TFile
    name: string
    value: string

    constructor(app: App, file: TFile, name: string, value: string){
        super(app)
        this.app = app
        this.file = file
        this.name = name
        this.value = value
    }

    onOpen(){
        const inputDiv = this.contentEl.createDiv({
            cls: "frontmatter-modal-value"
        })
        this.buildInputEl(inputDiv)
    }

    buildInputEl(inputDiv: HTMLDivElement): void{
        const form = inputDiv.createEl("form")
        form.type = "submit";
        form.onsubmit = (e: Event) => {
            e.preventDefault()
            linkContextMenu.replaceFrontmatterAttribute(this.app, this.file, this.name, inputEl.getValue())
            this.close()
        }
        const inputEl = new TextComponent(form)
        inputEl.setValue(this.value.toString())
        inputEl.inputEl.addClass("frontmatter-prompt-input")
    }
}