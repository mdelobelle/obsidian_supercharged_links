import SuperchargedLinks from "main"
import { DropdownComponent, ToggleComponent, Modal, App, TextComponent, TextAreaComponent, ButtonComponent, ExtraButtonComponent } from "obsidian"
import { linkTypes, matchTypes, CSSLink } from './cssLink'

class CSSBuilderModal extends Modal {

    plugin: SuperchargedLinks
    cssLink: CSSLink

    constructor(plugin: SuperchargedLinks) {
        super(plugin.app)
        this.cssLink = new CSSLink()
    }

    onOpen() {
        this.titleEl.setText(`Describe the way you want to style your links`)
        // case sensitive
        const caseSensitiveTogglerContainer = this.contentEl.createDiv()
        const caseSensitiveToggler = this.createTogglerContainer(caseSensitiveTogglerContainer, "Case sensitive")
        caseSensitiveToggler.setTooltip("should the css selector be case sensitive?")
        caseSensitiveToggler.setValue(this.cssLink.matchCaseSensitive)
        caseSensitiveToggler.onChange(value => this.cssLink.matchCaseSensitive = value)

        // matching type
        const matchingTypeSelectContainer = this.contentEl.createDiv()
        const matchingTypeSelectLabel = matchingTypeSelectContainer.createDiv()
        matchingTypeSelectLabel.setText("Matching type: ")
        const select = new DropdownComponent(matchingTypeSelectContainer)
        Object.keys(matchTypes).forEach(key => {
            select.addOption(key, matchTypes[key])
            if (key == this.cssLink.match) {
                select.setValue(key)
            }
        })
        select.onChange((value: "exact" | "contains" | "startswith" | "endswith") => {
            this.cssLink.match = value
        })

        // is tag
        const tagTogglerContainer = this.contentEl.createDiv()
        const isTagToggler = this.createTogglerContainer(tagTogglerContainer, "Tag")
        isTagToggler.setTooltip("Is this attribute a tag?")
        isTagToggler.setValue(this.cssLink.isTag)
        isTagToggler.onChange(value => {
            this.cssLink.isTag = value
            if (!value) { attrNameContainer.show() } else { attrNameContainer.hide() }
        })

        // attribute name
        const attrNameContainer = this.contentEl.createDiv()
        const attrName = this.createInputContainer(attrNameContainer, "Name", "Attribute name")
        attrName.onChange(name => {
            this.cssLink.name = name
        })
        if (!this.cssLink.isTag) {
            attrNameContainer.show()
        } else {
            attrNameContainer.hide()
        }
        // attribute value
        const attrValueContainer = this.contentEl.createDiv()
        const attrValue = this.createInputContainer(attrValueContainer, "Value", "Attribute or Tag (without #) value")
        attrValue.onChange(value => { this.cssLink.value = value })

        // links categories
        const linkTypesSelectContainer = this.contentEl.createDiv()
        Object.keys(linkTypes).forEach(value => {
            this.buildValueToggler(linkTypesSelectContainer, value)
        })

        // generate button
        const footer = this.contentEl.createDiv()
        const saveButton = new ButtonComponent(footer)
        saveButton.setButtonText("Generate CSS Boilerplate")
        saveButton.onClick(() => {
            cssBoilerPlate.setValue(this.cssLink.render())
        })

        //result
        const cssBoilerPlateContainer = this.contentEl.createDiv()
        const cssBoilerPlate = new TextAreaComponent(cssBoilerPlateContainer)
        cssBoilerPlate.inputEl.setAttr("rows", "10")
        cssBoilerPlate.inputEl.setAttr("style", "width: 30em")

    }

    buildValueToggler(valueGrid: HTMLDivElement, linkType: string) {
        const valueSelectorContainer = valueGrid.createDiv({
            cls: "frontmatter-value-selector-container"
        })
        const valueTogglerContainer = valueSelectorContainer.createDiv({
            cls: "frontmatter-value-selector-toggler"
        })
        const valueToggler = new ToggleComponent(valueTogglerContainer)
        this.cssLink.linksTypes.forEach(value => {
            if (value == linkType) {
                valueToggler.setValue(true)
            }
        })
        valueToggler.onChange(value => {
            if (value && !this.cssLink.linksTypes.includes(linkType)) {
                this.cssLink.linksTypes.push(linkType)
            }
            if (!value) {
                this.cssLink.linksTypes.remove(linkType)
            }
        })
        const valueLabel = valueSelectorContainer.createDiv({
            cls: "frontmatter-value-selector-label"
        })
        valueLabel.setText(linkType)
    }

    createTogglerContainer(parentNode: HTMLDivElement, label: string): ToggleComponent {
        const propertyContainerLabel = parentNode.createDiv({
            cls: 'frontmatter-checkbox-toggler'
        })
        propertyContainerLabel.setText(label)
        const toggler = new ToggleComponent(parentNode)
        return toggler
    }

    createInputContainer(parentNode: HTMLDivElement, label: string, placeholder: string = ""): TextComponent {
        const propertyNameContainerLabel = parentNode.createDiv()
        propertyNameContainerLabel.setText(label)
        const input = new TextComponent(parentNode)
        input.setPlaceholder(placeholder)
        return input
    }
}

export { CSSBuilderModal }