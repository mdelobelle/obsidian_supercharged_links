import {App, Modal, Setting, TextComponent, Notice, ButtonComponent} from "obsidian"
import SuperchargedLinks from "main"
import FrontMatterProperty from "src/FrontMatterProperty"

export default class FrontmatterPropertySettingsModal extends Modal {
	private propertyNamePromptEl: TextComponent;
	private presetValuesPromptEls: Array<TextComponent> = [];
    private saved: boolean = false;
	private property: FrontMatterProperty
    private plugin : SuperchargedLinks
    private initialProperty: FrontMatterProperty
    private parentSetting: Setting
    private new: boolean = true
    private parentSettingContainer: HTMLElement


	constructor(app: App, plugin: SuperchargedLinks, parentSettingContainer: HTMLElement, parentSetting?: Setting, property?: FrontMatterProperty){
		super(app)
        this.plugin = plugin
        this.parentSetting = parentSetting
        this.initialProperty = new FrontMatterProperty("", {}, "")
        this.parentSettingContainer = parentSettingContainer
		if(property){
            this.new = false
			this.property = property
            this.initialProperty.propertyName = property.propertyName
            this.initialProperty.propertyId = property.propertyId
            Object.keys(property.presetValues).forEach(k => {
                this.initialProperty.presetValues[k] =  property.presetValues[k]
            })
		} else {
            let newId = 1
            this.plugin.initialProperties.forEach(prop => {
                if(parseInt(prop.propertyId) && parseInt(prop.propertyId) >= newId){
                    newId = parseInt(prop.propertyId) + 1
                }
            })
			this.property = new FrontMatterProperty("", {}, newId.toString())
            this.initialProperty.propertyId = newId.toString()
		}
	}

    static copyProperty(target: FrontMatterProperty, source: FrontMatterProperty){
        target.propertyId = source.propertyId
        target.propertyName = source.propertyName
        Object.keys(source.presetValues).forEach(k => {
            target.presetValues[k] = source.presetValues[k]
        })
        Object.keys(target.presetValues).forEach(k => {
            if(!Object.keys(source.presetValues).includes(k)){
                delete target.presetValues[k]
            }
        })
    }

	onOpen(): void {
        if(this.property.propertyName == ""){
            this.titleEl.setText(`Add a property and set predefined`)
        }else{
            this.titleEl.setText(`Manage predefined values for ${this.property.propertyName}`)
        }
		this.createForm()
	}

    onClose(): void {
        Object.assign(this.property, this.initialProperty)
        if(!this.new){
            this.parentSetting.infoEl.textContent = 
                `${this.property.propertyName}: [${Object.keys(this.property.presetValues).map(k => this.property.presetValues[k]).join(', ')}]`
        } else if(this.saved) {
            let setting = new Setting(this.parentSettingContainer)
            setting.infoEl.textContent = 
                `${this.property.propertyName}: [${Object.keys(this.property.presetValues).map(k => this.property.presetValues[k]).join(', ')}]`
                setting.addButton((b) => {
                b.setIcon("pencil")
                    .setTooltip("Edit")
                    .onClick(() => {
                        let modal = new FrontmatterPropertySettingsModal(this.app, this.plugin, this.parentSettingContainer, setting, this.property);
                        modal.open();
                    });
            });
            setting.addButton((b) => {
                b.setIcon("trash")
                    .setTooltip("Delete")
                    .onClick(() => {
                        console.log(this.property.propertyId)
                    });
            });
        }
    }

    setValueListText(header: HTMLDivElement): void{
        header.setText(`Preset values: ${Object.values(this.property.presetValues).join(', ')}`)
    }

    createPropertyNameInputContainer(parentNode: HTMLDivElement): TextComponent {
        const input = new TextComponent(parentNode)
        const propertyName = this.property.propertyName
        input.setValue(propertyName)
        input.setPlaceholder("Name of the property")
        input.onChange(value => {
            this.property.propertyName = value
            this.titleEl.setText(`Manage predefined values for ${this.property.propertyName}`)
            FrontmatterPropertySettingsModal.removeValidationError(input, 2)
        })
        return input
    }
	
	removePresetValue(key: string): void{
        let newValues: Record<string, string> = {}
        for(let _key in this.property.presetValues){
            if(key !== _key){
                newValues[_key] = this.property.presetValues[_key]
            }
        }
		this.property.presetValues = newValues
	}

	createValueContainer(parentNode: HTMLDivElement, header: HTMLDivElement, key: string): TextComponent {
        const presetValue = this.property.presetValues[key]
		const valueContainer = parentNode.createDiv({
			cls: 'frontmatter-prompt-container',
		})
		const input = new TextComponent(valueContainer)
		input.setValue(presetValue)
		input.onChange(value => {
            this.property.presetValues[key] = value
            this.setValueListText(header)
            FrontmatterPropertySettingsModal.removeValidationError(input, 2)
        })
		const inputRemove = valueContainer.createEl("button")
		inputRemove.type = "button"
		inputRemove.textContent = "Delete"
		inputRemove.onClickEvent((evt: MouseEvent) => {
			evt.preventDefault
			this.removePresetValue(key)
			this.setValueListText(header)
			parentNode.removeChild(valueContainer)
            this.presetValuesPromptEls.remove(input)
				
		})
		return input
	}

	createForm(): void {
		const div = this.contentEl.createDiv({
			cls: "frontmatter-prompt-div"
		})
        const mainDiv = div.createDiv({
            cls: "frontmatter-prompt-form"
        })
        /* Property Name Section */
		const propertyNameContainer = mainDiv.createDiv()
		const propertyContainerLabel = propertyNameContainer.createDiv()
		propertyContainerLabel.setText(`Property Name:`)
        this.propertyNamePromptEl = this.createPropertyNameInputContainer(propertyNameContainer)
		

		mainDiv.createDiv({cls: 'frontmatter-separator'}).createEl("hr")

        /* Property Values */
		const valuesList = mainDiv.createDiv()
		const valuesListHeader = valuesList.createDiv()
		valuesListHeader.createEl("h2")
		valuesListHeader.setText(`Preset values: ${Object.values(this.property.presetValues).join(', ')}`)
		const valuesListBody = valuesList.createDiv()
		Object.keys(this.property.presetValues).forEach(key => {
			this.presetValuesPromptEls.push(this.createValueContainer(valuesListBody, valuesListHeader, key))
		})

        /* Add a new Values */
		const valuesListFooter = valuesList.createDiv()
		const addValue = valuesListFooter.createEl('button')
		addValue.type = 'button'
		addValue.textContent = 'Add'
		addValue.onClickEvent((evt: MouseEvent) => {
			evt.preventDefault
            this.property.insertNewValue("")
            .then(newKey => {this.createValueContainer(valuesListBody, valuesListHeader, newKey)})
			
		})

		mainDiv.createDiv({cls: 'frontmatter-separator'}).createEl("hr")

        /* footer buttons*/
        const footerEl = this.contentEl.createDiv()
        const footerButtons = new Setting(footerEl)
        footerButtons.addButton((b) => this.createSaveButton(b))
        footerButtons.addExtraButton((b) => {
            b.setIcon("cross")
                .setTooltip("Cancel")
                .onClick(() => {
                    this.saved = false;
                    /* reset values from settings */
                    if(this.initialProperty.propertyName != "") {
                        Object.assign(this.property, this.initialProperty)
                    }
                    this.close();
                });
            return b;
        });
	}

    createSaveButton(b: ButtonComponent): ButtonComponent{
        b.setTooltip("Save")
            .setIcon("checkmark")
            .onClick(async () => {
                let error = false
                if(/[^A-Za-z0-9]/.test(this.property.propertyName)){
                    FrontmatterPropertySettingsModal.setValidationError(
                        this.propertyNamePromptEl, this.propertyNamePromptEl.inputEl,
                        "Frontmatter property name can only contain a-z, A-Z, 0-9 characters."
                    );
                    error = true;
                }
                if(this.property.propertyName == ""){
                    FrontmatterPropertySettingsModal.setValidationError(
                        this.propertyNamePromptEl, this.propertyNamePromptEl.inputEl,
                        "Frontmatter property name can not be Empty."
                    );
                    error = true
                }
                this.presetValuesPromptEls.forEach(input => {
                    if(/[^A-Za-z0-9]/.test(input.inputEl.value)){
                        FrontmatterPropertySettingsModal.setValidationError(
                            input, input.inputEl.nextElementSibling,
                            "Frontmatter values can only contain a-z, A-Z, 0-9 characters."
                        );
                        error = true;
                    }
                    if(input.inputEl.value == ""){
                        FrontmatterPropertySettingsModal.setValidationError(
                            input, input.inputEl.nextElementSibling,
                            "Frontmatter values can't be null."
                        );
                        error = true;
                    }
                })
                if (error) {
                    new Notice("Fix errors before saving.");
                    return;
                }
                this.saved = true;
                const currentExistingProperty = this.plugin.initialProperties.filter(p => p.propertyId == this.property.propertyId)[0]
                if(currentExistingProperty){
                    FrontmatterPropertySettingsModal.copyProperty(currentExistingProperty, this.property)
                } else {
                    this.plugin.initialProperties.push(this.property)
                }
                this.initialProperty = this.property
                this.plugin.saveSettings()
                this.close();
            })
        return b
    }

    /* validation functions */

    static setValidationError(textInput: TextComponent, insertAfter: Element, message?: string) {
        textInput.inputEl.addClass("is-invalid");
        if (message) {

            let mDiv = textInput.inputEl.parentElement.querySelector(
                ".invalid-feedback"
            ) as HTMLDivElement;

            if (!mDiv) {
                mDiv = createDiv({ cls: "invalid-feedback" });
            }
            mDiv.innerText = message;
            mDiv.insertAfter(insertAfter);
        }
    }
    static removeValidationError(textInput: TextComponent, messagePosition: number) {
        textInput.inputEl.removeClass("is-invalid");

        if (textInput.inputEl.parentElement.children[2]) {
            textInput.inputEl.parentElement.removeChild(
                textInput.inputEl.parentElement.children[messagePosition]
            );
        }
    }
}