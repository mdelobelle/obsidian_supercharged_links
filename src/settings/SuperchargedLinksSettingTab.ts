import {App, PluginSettingTab, Setting, ButtonComponent} from "obsidian"
import SuperchargedLinks from "main"
import FrontmatterPropertySettingsModal from "src/settings/FrontmatterPropertySettingsModal"
import FrontMatterProperty from "src/FrontMatterProperty"

export default class SuperchargedLinksSettingTab extends PluginSettingTab {
	plugin: SuperchargedLinks;

	constructor(app: App, plugin: SuperchargedLinks) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for Supercharged Links.'});
        /* Managing extra attirbutes for a.internal-link */
		new Setting(containerEl)
			.setName('Target Attributes for styling')
			.setDesc('Frontmatter attributes to target, comma separated')
			.addTextArea((text) => {text
				.setPlaceholder('Enter attributes as string, comma separated')
				.setValue(this.plugin.settings.targetAttributes.join(', '))
				.onChange(async (value) => {
					this.plugin.settings.targetAttributes = value.replace(/\s/g,'').split(',');
					await this.plugin.saveSettings();
				})
				text.inputEl.rows = 6;
				text.inputEl.cols = 25;
			});
        
        /* Managing predefined values for properties */
        /* Add new property for which we want to preset values*/
		new Setting(containerEl)
			.setName("Add New")
			.setDesc("Add a new Frontmatter property for which you want preset values.")
			.addButton((button: ButtonComponent): ButtonComponent => {
				let b = button
					.setTooltip("Add Additional")
					.setButtonText("+")
					.onClick(async () => {
						let modal = new FrontmatterPropertySettingsModal(this.app, this.plugin, containerEl);
						modal.open();
					});

				return b;
			});

        /* Managed properties that currently have preset values */
		this.plugin.initialProperties.forEach(prop => {
            const property = new FrontMatterProperty("", {}, "")
            Object.assign(property, prop)
			let setting = new Setting(containerEl)
			setting.infoEl.textContent = 
                `${property.propertyName}: [${Object.keys(property.presetValues).map(k => property.presetValues[k]).join(', ')}]`
			setting.addButton((b) => {
                b.setIcon("pencil")
                    .setTooltip("Edit")
                    .onClick(() => {
                        let modal = new FrontmatterPropertySettingsModal(this.app, this.plugin, containerEl, setting, property);
                        modal.open();
                    });
            });
            setting.addButton((b) => {
                b.setIcon("trash")
                    .setTooltip("Delete")
                    .onClick(() => {
                        const currentExistingProperty = this.plugin.initialProperties.filter(p => p.propertyId == property.propertyId)[0]
						if(currentExistingProperty){
							this.plugin.initialProperties.remove(currentExistingProperty)
						}
						setting.settingEl.parentElement.removeChild(setting.settingEl)
						this.plugin.saveSettings()
                });
            });
		})
	}
}