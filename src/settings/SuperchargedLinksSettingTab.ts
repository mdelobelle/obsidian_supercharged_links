import { App, PluginSettingTab, Setting, debounce } from "obsidian"
import SuperchargedLinks from "main"
import { CSSBuilderModal, updateDisplay } from "../cssBuilder/cssBuilderModal";
import { buildCSS } from "../cssBuilder/cssBuilder";
import {updateVisibleLinks} from "../linkAttributes/linkAttributes";

export default class SuperchargedLinksSettingTab extends PluginSettingTab {
	plugin: SuperchargedLinks;
	debouncedGenerate: Function;

	constructor(app: App, plugin: SuperchargedLinks) {
		super(app, plugin);
		this.plugin = plugin;
		this.debouncedGenerate = debounce(this._generateSnippet, 1000, true);
		// Generate CSS immediately rather than 1 second - feels laggy
		this._generateSnippet();
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		/* Managing extra attirbutes for a.internal-link */
		new Setting(containerEl)
			.setName('Target Attributes for styling')
			.setDesc('Frontmatter attributes to target, comma separated')
			.addTextArea((text) => {
				text
					.setPlaceholder('Enter attributes as string, comma separated')
					.setValue(this.plugin.settings.targetAttributes.join(', '))
					.onChange(async (value) => {
						this.plugin.settings.targetAttributes = value.replace(/\s/g, '').split(',');
						if (this.plugin.settings.targetAttributes.length === 1 && !this.plugin.settings.targetAttributes[0]) {
							this.plugin.settings.targetAttributes = [];
						}
						await this.plugin.saveSettings();
					})
				text.inputEl.rows = 6;
				text.inputEl.cols = 25;
			});

		containerEl.createEl('h4', { text: 'Styling' });
		const styleSettingDescription = containerEl.createDiv();
		styleSettingDescription.innerHTML = `
Styling can be done using the Style Settings plugin. 
 <ol>
 <li>Create selectors down below.</li>
 <li>Go to the Style Settings tab and style your links!</li>
</ol>`
		const selectorDiv = containerEl.createDiv();
		this.drawSelectors(selectorDiv);


		containerEl.createEl('h4', { text: 'Settings' });
		new Setting(containerEl)
			.setName('Enable in Editor')
			.setDesc('If true, this will also supercharge internal links in the editor view of a note.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableEditor)
				toggle.onChange(value => {
					this.plugin.settings.enableEditor = value
					this.plugin.saveSettings()
					updateVisibleLinks(app, this.plugin);
				})
			})

		new Setting(containerEl)
			.setName('Enable in tab headers')
			.setDesc('If true, this will also supercharge the headers of a tab.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableTabHeader)
				toggle.onChange(value => {
					this.plugin.settings.enableTabHeader = value
					this.plugin.saveSettings()
					updateVisibleLinks(app, this.plugin);
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

		containerEl.createEl('h4', { text: 'Advanced' });
		// Managing choice wether you want to parse tags both from normal tags and in the frontmatter
		new Setting(containerEl)
			.setName('Parse all tags in the file')
			.setDesc('Sets the `data-link-tags`-attribute to look for tags both in the frontmatter and in the file as #tag-name')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.targetTags)
				toggle.onChange(async value => {
					this.plugin.settings.targetTags = value
					await this.plugin.saveSettings();
				})
			})

		// Managing choice wether you get attributes from inline fields and frontmatter or only frontmater
		new Setting(containerEl)
			.setName('Search for attribute in Inline fields like <field::>')
			.setDesc('Sets the `data-link-<field>`-attribute to the value of inline fields')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.getFromInlineField)
				toggle.onChange(async value => {
					this.plugin.settings.getFromInlineField = value
					await this.plugin.saveSettings()
				});
			});

		// Automatically activate snippet
		new Setting(containerEl)
			.setName('Automatically activate snippet')
			.setDesc('If true, this will automatically activate the generated CSS snippet "supercharged-links-gen.css". ' +
				'Turn this off if you don\'t want this to happen.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.activateSnippet)
				toggle.onChange(async value => {
					this.plugin.settings.activateSnippet = value
					await this.plugin.saveSettings()
				});
			});

		/* Managing predefined values for properties */
		/* Manage menu options display*/
		new Setting(containerEl)
			.setName("Display field options in context menu")
			.setDesc("This feature has been migrated to metadata-menu plugin https://github.com/mdelobelle/metadatamenu")
	}

	generateSnippet() {
		this.debouncedGenerate();
	}

	async _generateSnippet() {
		await buildCSS(this.plugin.settings.selectors, this.plugin);
		// new Notice("Generated supercharged-links-gen.css");
	}

	drawSelectors(div: HTMLElement) {
		div.empty();
		this.generateSnippet();
		const selectors = this.plugin.settings.selectors;
		selectors.forEach((selector, i) => {
			const s = new Setting(div)
				.addButton(button => {
					button.onClick(() => {
						const oldSelector = selectors[i + 1];
						selectors[i + 1] = selector;
						selectors[i] = oldSelector;
						this.drawSelectors(div);

					});
					button.setIcon("down-arrow-with-tail");
					button.setTooltip("Move selector down");
					if (i === selectors.length - 1) {
						button.setDisabled(true);
					}
				})
				.addButton(button => {
					button.onClick(() => {
						const oldSelector = selectors[i - 1];
						selectors[i - 1] = selector;
						selectors[i] = oldSelector;
						this.drawSelectors(div);

					});
					button.setIcon("up-arrow-with-tail");
					button.setTooltip("Move selector up");
					if (i === 0) {
						button.setDisabled(true);
					}
				})
				.addButton(button => {
					button.onClick(() => {
						const formModal = new CSSBuilderModal(this.plugin, (newSelector) => {
							this.plugin.settings.selectors[i] = newSelector;
							this.plugin.saveSettings();
							updateDisplay(s.nameEl, selector, this.plugin.settings);
							this.generateSnippet();
						}, selector);
						formModal.open();
					});
					button.setIcon("pencil");
					button.setTooltip("Edit selector")
				})
				.addButton(button => {
					button.onClick(() => {
						this.plugin.settings.selectors.remove(selector);
						this.plugin.saveSettings();
						this.drawSelectors(div);
					});
					button.setIcon("cross");
					button.setTooltip("Remove selector");
				});
			updateDisplay(s.nameEl, selector, this.plugin.settings);
		});

		new Setting(div)
			.setName("New selector")
			.setDesc("Create a new selector to style with Style Settings.")
			.addButton(button => {
				button.onClick(() => {
					const formModal = new CSSBuilderModal(this.plugin, (newSelector) => {
						this.plugin.settings.selectors.push(newSelector);
						this.plugin.saveSettings();
						this.drawSelectors(div);
						// TODO: Force redraw somehow?
					});
					formModal.open();
				});
				button.setButtonText("New");
			});
	}
}
