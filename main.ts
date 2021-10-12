import { Plugin, MarkdownView, Notice } from 'obsidian';
import SuperchargedLinksSettingTab from "src/settings/SuperchargedLinksSettingTab"
import {
	updateElLinks,
	updateVisibleLinks,
	updateDivLinks,
	updateEditorLinks,
	clearExtraAttributes, updateDivExtraAttributes
} from "src/linkAttributes/linkAttributes"
import { SuperchargedLinksSettings, DEFAULT_SETTINGS } from "src/settings/SuperchargedLinksSettings"
import Field from 'src/Field';
import linkContextMenu from "src/options/linkContextMenu"
import NoteFieldsCommandsModal from "src/options/NoteFieldsCommandsModal"
import FileClassAttributeSelectModal from 'src/fileClass/FileClassAttributeSelectModal';
import { CSSBuilderModal } from 'src/cssBuilder/cssBuilderModal'

export default class SuperchargedLinks extends Plugin {
	settings: SuperchargedLinksSettings;
	initialProperties: Array<Field> = []
	settingTab: SuperchargedLinksSettingTab
	private observers: MutationObserver[];

	async onload(): Promise<void> {
		console.log('Supercharged links loaded');
		await this.loadSettings();

		this.settings.presetFields.forEach(prop => {
			const property = new Field()
			Object.assign(property, prop)
			this.initialProperties.push(property)
		})
		this.addSettingTab(new SuperchargedLinksSettingTab(this.app, this));
		this.registerMarkdownPostProcessor((el, ctx) => {
			updateElLinks(this.app, this.settings, el, ctx)
		});
		this.app.workspace.on('file-open', () => {
			updateDivLinks(this.app, this.settings);
		})
		this.app.metadataCache.on('changed', (_file) => {
			updateVisibleLinks(this.app, this.settings);
			updateDivLinks(this.app, this.settings);
		});
		this.registerCodeMirror((cm) => {
			cm.on("update", () => {
				if (this.settings.enableEditor) {
					updateEditorLinks(this.app, this.settings);
				}
			})
		});

		this.observers = [];

		this.app.workspace.onLayoutReady(() => this.initViewObservers(this));
		this.app.workspace.on("layout-change", () => this.initViewObservers(this));

		this.addCommand({
			id: "field_options",
			name: "field options",
			hotkeys: [
				{
					modifiers: ["Alt"],
					key: 'O',
				},
			],
			callback: () => {
				const leaf = this.app.workspace.activeLeaf
				if (leaf.view instanceof MarkdownView && leaf.view.file) {
					const fieldsOptionsModal = new NoteFieldsCommandsModal(this.app, this, leaf.view.file)
					fieldsOptionsModal.open()
				}
			},
		});

		/* TODO : add a context menu for fileClass files to show the same options as in FileClassAttributeSelectModal*/
		this.addCommand({
			id: "fileClassAttr_options",
			name: "fileClass attributes options",
			hotkeys: [
				{
					modifiers: ["Alt"],
					key: 'P',
				},
			],
			callback: () => {
				const leaf = this.app.workspace.activeLeaf
				if (leaf.view instanceof MarkdownView && leaf.view.file && `${leaf.view.file.parent.path}/` == this.settings.classFilesPath) {
					const modal = new FileClassAttributeSelectModal(this, leaf.view.file)
					modal.open()
				} else {
					const notice = new Notice("This is not a fileClass", 2500)
				}
			},
		});

		this.addCommand({
			id: "css_snippet_helper",
			name: "CSS Snippet helper",
			callback: () => {
				const formModal = new CSSBuilderModal(this)
				formModal.open()
			},
		});

		new linkContextMenu(this)
	}

	initViewObservers(plugin: SuperchargedLinks) {
		plugin.observers.forEach((observer) => observer.disconnect());
		plugin.registerViewType('backlink', plugin);
		plugin.registerViewType('outgoing-link', plugin);
		plugin.registerViewType('search', plugin);
		plugin.registerViewType('breadcrumbs-matrix', plugin, 'internal-link', '', false);
		plugin.registerViewType('graph-analysis', plugin, 'internal-link', '', false);
		plugin.registerViewType('starred', plugin, 'nav-file', 'nav-file-title-content');
		plugin.registerViewType('file-explorer', plugin, 'nav-file', 'nav-file-title-content');
	}

	registerViewType(viewTypeName: string, plugin: SuperchargedLinks, parent_class = 'tree-item', own_class = 'tree-item-inner', searchParent = true) {
		const leaves = this.app.workspace.getLeavesOfType(viewTypeName);
		if (leaves.length > 1) console.error('more than one ' + viewTypeName + ' panel');
		else if (leaves.length < 1) return;
		else {
			plugin.watchContainer(leaves[0].view.containerEl, plugin, parent_class, own_class, searchParent);
		}
	}

	watchContainer(container: HTMLElement, plugin: SuperchargedLinks, parent_class = 'tree-item', own_class = 'tree-item-inner', searchParent = true) {
		const settings = plugin.settings;
		const app = plugin.app;
		let observer = new MutationObserver((records, _) => {
			records.forEach((mutation) => {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach((n) => {
						if ('className' in n) {
							// @ts-ignore
							if (n.className.includes && typeof n.className.includes === 'function' && n.className.includes(parent_class)) {
								if (searchParent) {
									const fileDivs = (n as HTMLElement).getElementsByClassName(own_class);
									for (let i = 0; i < fileDivs.length; ++i) {
										const link = fileDivs[i] as HTMLElement;
										clearExtraAttributes(link);
										if (settings.enableBacklinks) {
											updateDivExtraAttributes(app, settings, link, "");
										}
									}
								}
								else {
									clearExtraAttributes(n as HTMLElement);
									updateDivExtraAttributes(app, settings, n as HTMLElement, "");
								}
							}
						}
					})
				}
			})
		});
		observer.observe(container, { subtree: true, childList: true, attributes: false });
		plugin.observers.push(observer);
	}

	onunload() {
		this.observers.forEach((observer) => observer.disconnect());
		console.log('Supercharged links unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		this.settings.presetFields = this.initialProperties
		await this.saveData(this.settings);
	}
}