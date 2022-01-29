import SuperchargedLinks from "main"
import { DropdownComponent, ToggleComponent, Modal, App, TextComponent, TextAreaComponent, ButtonComponent, ExtraButtonComponent } from "obsidian"
import {matchTypes, matchPreview, CSSLink, matchPreviewPath, selectorType, SelectorTypes, MatchTypes} from './cssLink'

class CSSBuilderModal extends Modal {

    plugin: SuperchargedLinks
    cssLink: CSSLink

    constructor(plugin: SuperchargedLinks) {
        super(plugin.app)
        this.cssLink = new CSSLink();
        this.plugin = plugin;
    }

    updateDisplay(textArea: HTMLElement, saveButton: ButtonComponent) {
        let toDisplay: string;
        let disabled = false;
        if (this.cssLink.type === 'tag') {
            if (!this.cssLink.value) {
                toDisplay = "<b>Please choose a tag</b>";
                disabled = true;
            }
            else {
                toDisplay = `<span class="data-link-icon" data-link-tags="${this.cssLink.value}">Note</span> has tag <b>#${this.cssLink.value}</b>`;
            }
        }
        else if (this.cssLink.type === 'attribute') {
            console.log(this.plugin.settings.targetAttributes)
            if (this.plugin.settings.targetAttributes.length === 0) {
                toDisplay = "<b>No attributes added to attributes to target. Go to plugin settings to add them.</b>"
                disabled = true;
            }
            else if (!this.cssLink.name) {
                toDisplay = "<b>Please choose an attribute name.</b>";
                disabled = true;
            }
            else if (!this.cssLink.value){
                toDisplay = "<b>Please choose an attribute value.</b>"
                disabled = true;
            }
            else {
                toDisplay = `<span class="data-link-icon" data-link-${this.cssLink.name}="${this.cssLink.name}">Note</span> has attribute <b>${this.cssLink.name}</b> ${matchPreview[this.cssLink.match]} <b>${this.cssLink.value}</b>.`;
            }
        }
        else {
            if (!this.cssLink.value) {
                toDisplay = "<b>Please choose a path.</b>"
                disabled = true;
            }
            else {
                toDisplay = `The path of the <span class="data-link-icon" data-link-href="${this.cssLink.value}">note</span> ${matchPreviewPath[this.cssLink.match]} <b>${this.cssLink.value}</b>`
            }
        }
        textArea.innerHTML = toDisplay;
        saveButton.setDisabled(disabled);
    }

    onOpen() {
        this.titleEl.setText(`Select what links to style!`)
        // is tag
        const matchAttrPlaceholder = "Attribute value to match";
        const matchTagPlaceholder = "Tag to match (without #)";
        const matchPathPlaceholder = "Path to match";
        const matchAttrTxt = "Attribute value";
        const matchTagTxt = "Tag";
        const matchPathTxt = "Path";

        const tagTogglerContainer = this.contentEl.createDiv()
        const labelType = tagTogglerContainer.createDiv();
        labelType.setText("Type of selector");

        const typeSelect = new DropdownComponent(tagTogglerContainer);
        Object.keys(selectorType).forEach((type: SelectorTypes) => {
            typeSelect.addOption(type, selectorType[type]);
            if (type === this.cssLink.type) {
                typeSelect.setValue(type);
            }
        });
        typeSelect.onChange((type: SelectorTypes) => {
            this.cssLink.type = type;
            updateContainer(this.cssLink.type);
            this.updateDisplay(preview, saveButton);
        })
        // attribute name
        const attrNameContainer = this.contentEl.createDiv();
        const labelName = attrNameContainer.createDiv();
        labelName.setText("Attribute name");
        const attrName = new DropdownComponent(attrNameContainer);
        this.plugin.settings.targetAttributes.forEach((attribute: string) => {
            attrName.addOption(attribute, attribute);
            if (attribute === this.cssLink.name) {
                attrName.setValue(attribute);
            }
        });
        attrName.onChange(name => {
            this.cssLink.name = name;
            this.updateDisplay(preview, saveButton);
        });

        // attribute value
        const attrValueContainer = this.contentEl.createDiv();
        const [labelValue, attrValue] = this.createInputContainer(attrValueContainer, "Value to match", matchAttrPlaceholder)
        attrValue.inputEl.setAttr("style", "width: 20em");
        attrValue.onChange(value => {
            this.cssLink.value = value;
            this.updateDisplay(preview, saveButton);
        });


        // matching type
        const matchingTypeSelectContainer = this.contentEl.createDiv()
        const matchingTypeSelectLabel = matchingTypeSelectContainer.createDiv()
        matchingTypeSelectLabel.setText("Matching type: ")
        const select = new DropdownComponent(matchingTypeSelectContainer)
        Object.keys(matchTypes).forEach((key: MatchTypes)=> {
            select.addOption(key, matchTypes[key])
            if (key == this.cssLink.match) {
                select.setValue(key)
            }
        })
        select.onChange((value: "exact" | "contains" | "startswith" | "endswith") => {
            this.cssLink.match = value;
            this.updateDisplay(preview, saveButton);
        })


        // case sensitive
        const caseSensitiveTogglerContainer = this.contentEl.createDiv()
        const caseSensitiveToggler = this.createTogglerContainer(caseSensitiveTogglerContainer, "Case sensitive")
        caseSensitiveToggler.setTooltip("Should the css selector be case sensitive?")
        caseSensitiveToggler.setValue(this.cssLink.matchCaseSensitive)
        caseSensitiveToggler.onChange(value => {
            this.cssLink.matchCaseSensitive = value;
            this.updateDisplay(preview, saveButton);
        })
        if (!this.cssLink.name && this.plugin.settings.targetAttributes.length > 0) {
           this.cssLink.name = this.plugin.settings.targetAttributes[0];
        }
        const updateContainer = function(type: SelectorTypes) {

            if (type === 'attribute') {
                attrNameContainer.show();
                attrValue.setPlaceholder(matchAttrPlaceholder);
                labelValue.setText(matchAttrTxt);
                matchingTypeSelectContainer.show();
                caseSensitiveTogglerContainer.show();
            }
            else if (type === 'tag') {
                attrNameContainer.hide();
                labelValue.setText(matchTagTxt);
                attrValue.setPlaceholder(matchTagPlaceholder);
                matchingTypeSelectContainer.hide();
                caseSensitiveTogglerContainer.hide();
            }
            else {
                attrNameContainer.hide();
                attrValue.setPlaceholder(matchPathPlaceholder);
                labelValue.setText(matchPathTxt);
                matchingTypeSelectContainer.show();
                caseSensitiveTogglerContainer.show();
            }
        }

        updateContainer(this.cssLink.type);

        // generate button
        const footer = this.contentEl.createDiv()
        const saveButton = new ButtonComponent(footer)
        saveButton.setButtonText("Save")
        saveButton.onClick(() => {
            // TODO
            // cssBoilerPlate.setValue(this.cssLink.render())
        });
        const preview = this.contentEl.createDiv()
        this.updateDisplay(preview, saveButton);
    }

    createTogglerContainer(parentNode: HTMLDivElement, label: string): ToggleComponent {
        const propertyContainerLabel = parentNode.createDiv({
            cls: 'frontmatter-checkbox-toggler'
        });
        propertyContainerLabel.setText(label);
        const toggler = new ToggleComponent(parentNode);
        return toggler;
    }

    createInputContainer(parentNode: HTMLDivElement, label: string, placeholder: string = ""): [HTMLDivElement, TextComponent] {
        const propertyNameContainerLabel = parentNode.createDiv()
        propertyNameContainerLabel.setText(label)
        const input = new TextComponent(parentNode)
        input.setPlaceholder(placeholder)
        return [propertyNameContainerLabel, input]
    }
}

export { CSSBuilderModal }