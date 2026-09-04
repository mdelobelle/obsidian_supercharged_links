import { App, Debouncer, PluginSettingTab, sanitizeHTMLToDom, Setting, debounce } from "obsidian"
import SuperchargedLinks from "main"
import { CSSBuilderModal, updateDisplay } from "../cssBuilder/cssBuilderModal";
import { buildCSS } from "../cssBuilder/cssBuilder";
import {updateVisibleLinks} from "../linkAttributes/linkAttributes";
import { t } from "src/i18n";

export default class SuperchargedLinksSettingTab extends PluginSettingTab {
	plugin: SuperchargedLinks;
	debouncedGenerate: Debouncer<[], Promise<void>>;

	constructor(app: App, plugin: SuperchargedLinks) {
		super(app, plugin);
		this.plugin = plugin;
		this.debouncedGenerate = debounce(() => this._generateSnippet(), 1000, true);
		// Generate CSS immediately rather than 1 second - feels laggy
		void this._generateSnippet();
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		/* Managing extra attirbutes for a.internal-link */
		new Setting(containerEl)
			.setName(t('settings.targetAttributes.name', 'Target Attributes for styling'))
			.setDesc(t('settings.targetAttributes.desc', 'Frontmatter attributes to target, comma separated'))
			.addTextArea((text) => {
				text
					.setPlaceholder(t('settings.targetAttributes.placeholder', 'Enter attributes as string, comma separated'))
					.setValue(this.plugin.settings.targetAttributes.join(', '))
					.onChange(async (value) => {
						this.plugin.settings.targetAttributes = value.split(',').map(attr => attr.trim());
						if (this.plugin.settings.targetAttributes.length === 1 && !this.plugin.settings.targetAttributes[0]) {
							this.plugin.settings.targetAttributes = [];
						}
						await this.plugin.saveSettings();
					})
				text.inputEl.rows = 6;
				text.inputEl.cols = 25;
			});

		new Setting(containerEl)
			.setName(t('sections.styling', 'Styling'))
			.setHeading();
		const styleSettingDescription = containerEl.createDiv();
		styleSettingDescription.appendChild(sanitizeHTMLToDom(t('styling.helper.html', `Styling can be done using the Style Settings plugin. 
 <ol>
 <li>Create selectors down below.</li>
 <li>Go to the Style Settings tab and style your links!</li>
</ol>`)));
		const selectorDiv = containerEl.createDiv();
		this.drawSelectors(selectorDiv);


		new Setting(containerEl)
			.setName(t('sections.settings', 'Settings'))
			.setHeading();
		new Setting(containerEl)
			.setName(t('settings.enableEditor.name', 'Enable in Editor'))
			.setDesc(t('settings.enableEditor.desc', 'If true, this will also supercharge internal links in the editor view of a note.'))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableEditor)
				toggle.onChange(async value => {
					this.plugin.settings.enableEditor = value
					await this.plugin.saveSettings()
					updateVisibleLinks(this.app, this.plugin);
				})
			})

		new Setting(containerEl)
			.setName(t('settings.enableTabHeader.name', 'Enable in tab headers'))
			.setDesc(t('settings.enableTabHeader.desc', 'If true, this will also supercharge the headers of a tab.'))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableTabHeader)
				toggle.onChange(async value => {
					this.plugin.settings.enableTabHeader = value
					await this.plugin.saveSettings()
					updateVisibleLinks(this.app, this.plugin);
				})
			})

		new Setting(containerEl)
			.setName(t('settings.enableFileList.name', 'Enable in File Browser'))
			.setDesc(t('settings.enableFileList.desc', 'If true, this will also supercharge the file browser.'))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableFileList)
				toggle.onChange(async value => {
					this.plugin.settings.enableFileList = value
					await this.plugin.saveSettings()
				})
			});

		new Setting(containerEl)
			.setName(t('settings.enableBases.name', 'Enable in Bases'))
			.setDesc(t('settings.enableBases.desc', 'If true, this will also supercharge Obsidian Bases.'))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableBases)
				toggle.onChange(async value => {
					this.plugin.settings.enableBases = value
					await this.plugin.saveSettings()
				});
			});

		new Setting(containerEl)
			.setName(t('settings.enableBacklinks.name', 'Enable in Plugins'))
			.setDesc(t('settings.enableBacklinks.desc', 'If true, this will also supercharge plugins like the backlinks and forward links panels.'))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableBacklinks)
				toggle.onChange(async value => {
					this.plugin.settings.enableBacklinks = value
					await this.plugin.saveSettings()
				});
			});
		new Setting(containerEl)
			.setName(t('settings.enableQuickSwitcher.name', 'Enable in Quick Switcher'))
			.setDesc(t('settings.enableQuickSwitcher.desc', 'If true, this will also supercharge the quick switcher.'))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableQuickSwitcher)
				toggle.onChange(async value => {
					this.plugin.settings.enableQuickSwitcher = value
					await this.plugin.saveSettings()
				});
			});
		new Setting(containerEl)
			.setName(t('settings.enableSuggestor.name', 'Enable in Link Autocompleter'))
			.setDesc(t('settings.enableSuggestor.desc', 'If true, this will also supercharge the link autocompleter.'))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.enableSuggestor)
				toggle.onChange(async value => {
					this.plugin.settings.enableSuggestor = value
					await this.plugin.saveSettings()
				});
			});

		new Setting(containerEl)
			.setName(t('sections.advanced', 'Advanced'))
			.setHeading();
		// Managing choice wether you want to parse tags both from normal tags and in the frontmatter
		new Setting(containerEl)
			.setName(t('settings.targetTags.name', 'Parse all tags in the file'))
			.setDesc(t('settings.targetTags.desc', 'Sets the `data-link-tags`-attribute to look for tags both in the frontmatter and in the file as #tag-name'))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.targetTags)
				toggle.onChange(async value => {
					this.plugin.settings.targetTags = value
					await this.plugin.saveSettings();
				})
			})

		// Managing choice wether you get attributes from inline fields and frontmatter or only frontmater
		new Setting(containerEl)
			.setName(t('settings.getFromInlineField.name', 'Search for attribute in Inline fields like <field::>'))
			.setDesc(t('settings.getFromInlineField.desc', 'Sets the `data-link-<field>`-attribute to the value of inline fields'))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.getFromInlineField)
				toggle.onChange(async value => {
					this.plugin.settings.getFromInlineField = value
					await this.plugin.saveSettings()
				});
			});

		// Automatically activate snippet
		new Setting(containerEl)
			.setName(t('settings.activateSnippet.name', 'Automatically activate snippet'))
			.setDesc(t('settings.activateSnippet.desc', 'If true, this will automatically activate the generated CSS snippet "supercharged-links-gen.css". Turn this off if you don\'t want this to happen.'))
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
			.setName(t('settings.deprecatedMenu.name', 'Display field options in context menu'))
			.setDesc(t('settings.deprecatedMenu.desc', 'This feature has been migrated to metadata-menu plugin https://github.com/mdelobelle/metadatamenu'))
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
					button.setTooltip(t('selectors.tooltip.moveDown', 'Move selector down'));
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
					button.setTooltip(t('selectors.tooltip.moveUp', 'Move selector up'));
					if (i === 0) {
						button.setDisabled(true);
					}
				})
				.addButton(button => {
					button.onClick(() => {
						const formModal = new CSSBuilderModal(this.plugin, (newSelector) => {
							this.plugin.settings.selectors[i] = newSelector;
							void this.plugin.saveSettings();
							updateDisplay(s.nameEl, selector, this.plugin.settings);
							this.generateSnippet();
						}, selector);
						formModal.open();
					});
					button.setIcon("pencil");
					button.setTooltip(t('selectors.tooltip.edit', 'Edit selector'))
				})
				.addButton(button => {
					button.onClick(() => {
						this.plugin.settings.selectors.remove(selector);
						void this.plugin.saveSettings();
						this.drawSelectors(div);
					});
					button.setIcon("cross");
					button.setTooltip(t('selectors.tooltip.remove', 'Remove selector'));
				});
			updateDisplay(s.nameEl, selector, this.plugin.settings);
		});

		new Setting(div)
			.setName(t('selectors.new.name', 'New selector'))
			.setDesc(t('selectors.new.desc', 'Create a new selector to style with Style Settings.'))
			.addButton(button => {
				button.onClick(() => {
					const formModal = new CSSBuilderModal(this.plugin, (newSelector) => {
						this.plugin.settings.selectors.push(newSelector);
						void this.plugin.saveSettings();
						this.drawSelectors(div);
						// TODO: Force redraw somehow?
					});
					formModal.open();
				});
				button.setButtonText(t('selectors.button.new', 'New'));
			});
	}
}
