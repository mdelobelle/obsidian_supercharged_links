import {App, PluginSettingTab, Setting, ButtonComponent, ToggleComponent} from "obsidian"
import SuperchargedLinks from "main"
import FieldSettingsModal from "src/settings/FieldSettingsModal"
import Field from "src/Field"
import FieldSetting from "src/settings/FieldSetting"

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
					if (this.plugin.settings.targetAttributes.length === 1 && !this.plugin.settings.targetAttributes[0]) {
						this.plugin.settings.targetAttributes = [];
					}
					await this.plugin.saveSettings();
				})
				text.inputEl.rows = 6;
				text.inputEl.cols = 25;
			});

		new Setting(containerEl)
			.setName('Enable in Editor')
			.setDesc('If true, this will also supercharge internal links in the editor view of a note.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableEditor)
				toggle.onChange(value => {
					this.plugin.settings.enableEditor = value
					this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Enable in File Browser')
			.setDesc('If true, this will also supercharge the file browser.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableFileList)
				toggle.onChange(value => {
					this.plugin.settings.enableFileList = value
					this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Enable in Plugins')
			.setDesc('If true, this will also supercharge plugins like the backlinks and forward links panels.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableBacklinks)
				toggle.onChange(value => {
					this.plugin.settings.enableBacklinks = value
					this.plugin.saveSettings()
				});
			});
		new Setting(containerEl)
			.setName('Enable in Quick Switcher')
			.setDesc('If true, this will also supercharge the quick switcher.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableQuickSwitcher)
				toggle.onChange(value => {
					this.plugin.settings.enableQuickSwitcher = value
					this.plugin.saveSettings()
				});
			});
		new Setting(containerEl)
			.setName('Enable in Link Autocompleter')
			.setDesc('If true, this will also supercharge the link autocompleter.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableSuggestor)
				toggle.onChange(value => {
					this.plugin.settings.enableSuggestor = value
					this.plugin.saveSettings()
				});
			});

		// Managing choice wether you want to parse tags both from normal tags and in the frontmatter
		new Setting(containerEl)
			.setName('Parse all tags in the file')
			.setDesc('Sets the `data-link-tags`-attribute to look for tags both in the frontmatter and in the file as #tag-name')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.targetTags)
				toggle.onChange(value => {
					this.plugin.settings.targetTags = value
					this.plugin.saveSettings()
				})
			})

		// Managing choice wether you get attributes from inline fields and frontmatter or only frontmater
		new Setting(containerEl)
		.setName('Search for attribute in Inline fields like <field::>')
		.setDesc('Sets the `data-link-<field>`-attribute to the value of inline fields')
		.addToggle(toggle => {
			toggle.setValue(this.plugin.settings.getFromInlineField)
				toggle.onChange(value => {
					this.plugin.settings.getFromInlineField = value
					this.plugin.saveSettings()
				})
		})

        /* Managing predefined values for properties */
		/* Manage menu options display*/
		new Setting(containerEl)
			.setName("Display field options in context menu")
			.setDesc("Choose to show or hide fields options in the context menu of a link or a file")
			.addToggle((toggle: ToggleComponent) => {
				toggle.setValue(this.plugin.settings.displayFieldsInContextMenu)
				toggle.onChange(value => {
					this.plugin.settings.displayFieldsInContextMenu = value
					this.plugin.saveSettings()
				})
			})
		/* Exclude Fields from context menu*/
		new Setting(containerEl)
			.setName('Ignored fields')
			.setDesc('Fields to be ignored by the plugin when adding options to the context menu')
			.addTextArea((text) => {text
				.setPlaceholder('Enter fields as string, comma separated')
				.setValue(this.plugin.settings.globallyIgnoredFields.join(', '))
				.onChange(async (value) => {
					this.plugin.settings.globallyIgnoredFields = value.replace(/\s/g,'').split(',');
					await this.plugin.saveSettings();
				})
				text.inputEl.rows = 6;
				text.inputEl.cols = 25;
			});

		/* Set classFiles Path*/
		new Setting(containerEl)
		.setName('class Files path')
		.setDesc('Path to the files containing the authorized fields for a type of note')
		.addText((text) => {text
			.setPlaceholder('Path/')
			.setValue(this.plugin.settings.classFilesPath)
			.onChange(async (value) => {
				this.plugin.settings.classFilesPath = value
				await this.plugin.saveSettings();
			})
		});

        /* Add new property for which we want to preset values*/
		new Setting(containerEl)
			.setName("Add New Property Manager")
			.setDesc("Add a new Frontmatter property for which you want preset values.")
			.addButton((button: ButtonComponent): ButtonComponent => {
				let b = button
					.setTooltip("Add New Property Manager")
					.setButtonText("+")
					.onClick(async () => {
						let modal = new FieldSettingsModal(this.app, this.plugin, containerEl);
						modal.open();
					});

				return b;
			});

        /* Managed properties that currently have preset values */
		this.plugin.initialProperties.forEach(prop => {
            const property = new Field()
            Object.assign(property, prop)
			new FieldSetting(containerEl, property, this.app, this.plugin)
		})
	}
}
