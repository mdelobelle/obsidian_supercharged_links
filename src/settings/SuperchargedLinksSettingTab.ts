import {App, PluginSettingTab, Setting, ButtonComponent} from "obsidian"
import SuperchargedLinks from "main"
import FrontmatterPropertySettingsModal from "src/settings/FrontmatterPropertySettingsModal"
import FrontMatterProperty from "src/FrontMatterProperty"
import FrontmatterPropertySetting from "src/settings/FrontmatterPropertySetting"

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
			.setName("Add New Property Manager")
			.setDesc("Add a new Frontmatter property for which you want preset values.")
			.addButton((button: ButtonComponent): ButtonComponent => {
				let b = button
					.setTooltip("Add New Property Manager")
					.setButtonText("+")
					.onClick(async () => {
						let modal = new FrontmatterPropertySettingsModal(this.app, this.plugin, containerEl);
						modal.open();
					});

				return b;
			});

        /* Managed properties that currently have preset values */
		this.plugin.initialProperties.forEach(prop => {
            const property = new FrontMatterProperty()
            Object.assign(property, prop)
			new FrontmatterPropertySetting(containerEl, property, this.app, this.plugin)
		})
	}
}