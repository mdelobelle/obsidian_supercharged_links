import SuperchargedLinks from "main"
import { DropdownComponent, ToggleComponent, Modal, App, TextComponent, TextAreaComponent, ButtonComponent, ExtraButtonComponent } from "obsidian"
import {matchTypes, matchPreview, CSSLink, matchPreviewPath, selectorType, SelectorTypes, MatchTypes} from './cssLink'
import {SuperchargedLinksSettings} from "../settings/SuperchargedLinksSettings";

export function displayText(link: CSSLink, settings: SuperchargedLinksSettings): string {
    if (link.type === 'tag') {
        if (!link.value) {
            return "<b>Please choose a tag</b>";
        }
        return `<span class="data-link-icon" data-link-tags="${link.value}">Note</span> has tag <b>#${link.value}</b>`;
    }
    else if (link.type === 'attribute') {
        if (settings.targetAttributes.length === 0) {
            return `<b>No attributes added to "Target attributes". Go to plugin settings to add them.</b>`
        }
        if (!link.name) {
            return "<b>Please choose an attribute name.</b>";
        }
        if (!link.value){
            return "<b>Please choose an attribute value.</b>"
        }
        return `<span class="data-link-icon" data-link-${link.name}="${link.value}">Note</span> has attribute <b>${link.name}</b> ${matchPreview[link.match]} <b>${link.value}</b>.`;
    }
    if (!link.value) {
        return "<b>Please choose a path.</b>"
    }
    return `The path of the <span class="data-link-icon" data-link-href="${link.value}">note</span> ${matchPreviewPath[link.match]} <b>${link.value}</b>`
}

export function updateDisplay(textArea: HTMLElement, link: CSSLink, settings: SuperchargedLinksSettings): boolean {
    let toDisplay: string = displayText(link, settings);
    let disabled = false;
    if (link.type === 'tag') {
        if (!link.value) {
            disabled = true;
        }
    }
    else if (link.type === 'attribute') {
        if (settings.targetAttributes.length === 0) {
            disabled = true;
        }
        else if (!link.name) {
            disabled = true;
        }
        else if (!link.value){
            disabled = true;
        }
    }
    else {
        if (!link.value) {
            disabled = true;
        }
    }
    textArea.innerHTML = toDisplay;
    return disabled;
}

class CSSBuilderModal extends Modal {

    plugin: SuperchargedLinks
    cssLink: CSSLink
    saveCallback: (cssLink: CSSLink) => void;

    constructor(plugin: SuperchargedLinks, saveCallback: (cssLink: CSSLink) => void, cssLink: CSSLink=null) {
        super(plugin.app)
        this.cssLink = cssLink;
        if (!cssLink) {
            this.cssLink = new CSSLink();
        }
        this.plugin = plugin;
        this.saveCallback = saveCallback;
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
            saveButton.setDisabled(updateDisplay(preview, this.cssLink, this.plugin.settings));
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
            saveButton.setDisabled(updateDisplay(preview, this.cssLink, this.plugin.settings));
        });

        // attribute value
        const attrValueContainer = this.contentEl.createDiv();
        const [labelValue, attrValue] = this.createInputContainer(attrValueContainer, "Value to match", matchAttrPlaceholder)
        attrValue.inputEl.setAttr("style", "width: 20em");
        attrValue.onChange(value => {
            this.cssLink.value = value;
            saveButton.setDisabled(updateDisplay(preview, this.cssLink, this.plugin.settings));
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
            saveButton.setDisabled(updateDisplay(preview, this.cssLink, this.plugin.settings));
        });


        // case sensitive
        const caseSensitiveTogglerContainer = this.contentEl.createDiv()
        const caseSensitiveToggler = this.createTogglerContainer(caseSensitiveTogglerContainer, "Case sensitive")
        caseSensitiveToggler.setTooltip("Should the css selector be case sensitive?")
        caseSensitiveToggler.setValue(this.cssLink.matchCaseSensitive)
        caseSensitiveToggler.onChange(value => {
            this.cssLink.matchCaseSensitive = value;
            saveButton.setDisabled(updateDisplay(preview, this.cssLink, this.plugin.settings));
        });
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
            this.saveCallback(this.cssLink);
            this.close();
        });
        const preview = this.contentEl.createDiv()
        saveButton.setDisabled(updateDisplay(preview, this.cssLink, this.plugin.settings));
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