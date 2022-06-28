import {Plugin, MarkdownView, Notice, debounce} from 'obsidian';
import SuperchargedLinksSettingTab from "src/settings/SuperchargedLinksSettingTab"
import {
	updateElLinks,
	updateVisibleLinks,
	clearExtraAttributes,
	updateDivExtraAttributes,
} from "src/linkAttributes/linkAttributes"
import { SuperchargedLinksSettings, DEFAULT_SETTINGS } from "src/settings/SuperchargedLinksSettings"
import Field from 'src/Field';
import linkContextMenu from "src/options/linkContextMenu"
import NoteFieldsCommandsModal from "src/options/NoteFieldsCommandsModal"
import FileClassAttributeSelectModal from 'src/fileClass/FileClassAttributeSelectModal';
import { Prec } from "@codemirror/state";
import {buildCMViewPlugin} from "./src/linkAttributes/livePreview";

export default class SuperchargedLinks extends Plugin {
	settings: SuperchargedLinksSettings;
	initialProperties: Array<Field> = []
	settingTab: SuperchargedLinksSettingTab
	private observers: [MutationObserver, string, string][];
	private modalObservers: MutationObserver[] = [];

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
			updateElLinks(this.app, this, el, ctx)
		});

		// Plugins watching
		this.registerEvent(this.app.metadataCache.on('changed', debounce((_file) => {
			updateVisibleLinks(this.app, this);
			this.observers.forEach(([observer, type, own_class ]) => {
				const leaves = this.app.workspace.getLeavesOfType(type);
				leaves.forEach(leaf => {
					this.updateContainer(leaf.view.containerEl, this, own_class);
				})
			});
			// Debounced to prevent lag when writing
		}, 4500, true)));


		// Live preview
		const ext = Prec.lowest(buildCMViewPlugin(this.app, this.settings));
		this.registerEditorExtension(ext);

		this.observers = [];

		this.app.workspace.onLayoutReady(() => {
			this.initViewObservers(this);
			this.initModalObservers(this, document);
		});
		this.registerEvent(this.app.workspace.on("window-open", (window, win) => this.initModalObservers(this, window.getContainer().doc)));
		this.registerEvent(this.app.workspace.on("layout-change", () => this.initViewObservers(this)));

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

		new linkContextMenu(this)
	}

	initViewObservers(plugin: SuperchargedLinks) {
		// Reset observers
		plugin.observers.forEach(([observer, type ]) => {
			observer.disconnect();
		});
		plugin.observers = [];

		// Register new observers
		plugin.registerViewType('backlink', plugin, ".tree-item-inner", true);
		plugin.registerViewType('outgoing-link', plugin, ".tree-item-inner", true);
		plugin.registerViewType('search', plugin, ".tree-item-inner");
		plugin.registerViewType('BC-matrix', plugin, '.BC-Link');
		plugin.registerViewType('BC-ducks', plugin, '.internal-link');
		plugin.registerViewType('BC-tree', plugin, 'a.internal-link');
		plugin.registerViewType('graph-analysis', plugin, '.internal-link');
		plugin.registerViewType('starred', plugin, '.nav-file-title-content');
		plugin.registerViewType('file-explorer', plugin, '.nav-file-title-content');
		plugin.registerViewType('recent-files', plugin, '.nav-file-title-content');
		// If backlinks in editor is on
		// @ts-ignore
		if (plugin.app?.internalPlugins?.plugins?.backlink?.instance?.options?.backlinkInDocument) {
			plugin.registerViewType('markdown', plugin, '.tree-item-inner', true);
		}
	}

	initModalObservers(plugin: SuperchargedLinks, doc: Document) {
		const config = {
			subtree: false,
			childList: true,
			attributes: false
		};

		this.modalObservers.push(new MutationObserver(records => {
			records.forEach((mutation) => {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach(n => {
						if ('className' in n &&
							// @ts-ignore
							(n.className.includes('modal-container') && plugin.settings.enableQuickSwitcher
								// @ts-ignore
								|| n.className.includes('suggestion-container') && plugin.settings.enableSuggestor)) {
							let selector = ".suggestion-item, .suggestion-note, .another-quick-switcher__item__title, .omnisearch-result__title";
							// @ts-ignore
							if (n.className.includes('suggestion-container')) {
								selector = ".suggestion-content, .suggestion-note";
							}
							plugin.updateContainer(n as HTMLElement, plugin, selector);
							plugin._watchContainer(null, n as HTMLElement, plugin, selector);
						}
					});
				}
			});
		}));
		this.modalObservers.last().observe(doc.body, config);
	}

	registerViewType(viewTypeName: string, plugin: SuperchargedLinks, selector: string, updateDynamic = false ){
		const leaves = this.app.workspace.getLeavesOfType(viewTypeName);
		if (leaves.length > 1) {
			for (let i=0; i < leaves.length; i++) {
				const container = leaves[i].view.containerEl;
				if (updateDynamic) {
					plugin._watchContainerDynamic(viewTypeName + i, container, plugin, selector)
				}
				else {
					plugin._watchContainer(viewTypeName + i, container, plugin, selector);
				}
			}
		}
		else if (leaves.length < 1) return;
		else {
			const container = leaves[0].view.containerEl;
			this.updateContainer(container, plugin, selector);
			if (updateDynamic) {
				plugin._watchContainerDynamic(viewTypeName, container, plugin, selector)
			}
			else {
				plugin._watchContainer(viewTypeName, container, plugin, selector);
			}
		}
	}

	updateContainer(container: HTMLElement, plugin: SuperchargedLinks, selector: string) {
		if (!plugin.settings.enableBacklinks) return;
		const nodes = container.findAll(selector);
		for (let i = 0; i < nodes.length; ++i)  {
			const el = nodes[i] as HTMLElement;
			updateDivExtraAttributes(plugin.app, plugin.settings, el, "");
		}
	}

	removeFromContainer(container: HTMLElement, selector: string) {
		const nodes = container.findAll(selector);
		for (let i = 0; i < nodes.length; ++i)  {
		    const el = nodes[i] as HTMLElement;
			clearExtraAttributes(el);
		}
	}

	_watchContainer(viewType: string, container: HTMLElement, plugin: SuperchargedLinks, selector: string) {
		let observer = new MutationObserver((records, _) => {
			 plugin.updateContainer(container, plugin, selector);
		});
		observer.observe(container, { subtree: true, childList: true, attributes: false });
		if (viewType) {
			plugin.observers.push([observer, viewType, selector]);
		}
	}

	_watchContainerDynamic(viewType: string, container: HTMLElement, plugin: SuperchargedLinks, selector: string, own_class='tree-item-inner', parent_class='tree-item') {
		// Used for efficient updating of the backlinks panel
		// Only loops through newly added DOM nodes instead of changing all of them
		let observer = new MutationObserver((records, _) => {
			records.forEach((mutation) => {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach((n) => {
						if ('className' in n) {
							// @ts-ignore
							if (n.className.includes && typeof n.className.includes === 'function' && n.className.includes(parent_class)) {
								const fileDivs = (n as HTMLElement).getElementsByClassName(own_class);
								for (let i = 0; i < fileDivs.length; ++i) {
									const link = fileDivs[i] as HTMLElement;
									updateDivExtraAttributes(plugin.app, plugin.settings, link, "");
								}
							}
						}
					});
				}
			});
		});
		observer.observe(container, { subtree: true, childList: true, attributes: false });
		plugin.observers.push([observer, viewType, selector]);
	}


	onunload() {
		this.observers.forEach(([observer, type, own_class ]) => {
			observer.disconnect();
			const leaves = this.app.workspace.getLeavesOfType(type);
			leaves.forEach(leaf => {
				this.removeFromContainer(leaf.view.containerEl, own_class);
			})
		});
		for (const observer of this.modalObservers) {
			observer.disconnect();
		}
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
