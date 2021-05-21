import { timeStamp } from "console"
import {App, Setting, Plugin} from "obsidian"
import SuperchargedLinks from "main"
import Field from "src/Field"
import FieldSettingsModal from "src/settings/FieldSettingsModal"

export default class FieldSetting extends Setting {
    property: Field
    app: App
    plugin: SuperchargedLinks
    containerEl: HTMLElement
    constructor(containerEl: HTMLElement, property: Field, app: App, plugin: SuperchargedLinks){
        super(containerEl)
        this.containerEl = containerEl
        this.property = property
        this.app = app
        this.plugin = plugin
        this.setTextContentWithname()
        this.addEditButton()
        this.addDeleteButton()

    }
    
    setTextContentWithname(): void{
        this.infoEl.textContent = 
        `${this.property.name}: [${Object.keys(this.property.values).map(k => this.property.values[k]).join(', ')}]`
    }
    

    addEditButton(): void{
        this.addButton((b) => {
            b.setIcon("pencil")
                    .setTooltip("Edit")
                    .onClick(() => {
                        let modal = new FieldSettingsModal(this.app, this.plugin, this.containerEl, this, this.property);
                        modal.open();
                    });
        })
    }

    addDeleteButton(): void{
        this.addButton((b) => {
            b.setIcon("trash")
                .setTooltip("Delete")
                .onClick(() => {
                    const currentExistingProperty = this.plugin.initialProperties.filter(p => p.id == this.property.id)[0]
                    if(currentExistingProperty){
                        this.plugin.initialProperties.remove(currentExistingProperty)
                    }
                    this.settingEl.parentElement.removeChild(this.settingEl)
                    this.plugin.saveSettings()
            });
        });
    }
}