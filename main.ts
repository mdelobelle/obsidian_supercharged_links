import {Plugin, debounce, TFile} from 'obsidian';
import SuperchargedLinksSettingTab from "src/settings/SuperchargedLinksSettingTab"
import {
	updateElLinks,
	updateVisibleLinks,
	clearExtraAttributes,
	updateDivExtraAttributes, updatePropertiesPane,
	initializeCumulativeLinkService,
	updateCumulativeLinkService,
	
} from "src/linkAttributes/linkAttributes"
import { SuperchargedLinksSettings, DEFAULT_SETTINGS } from "src/settings/SuperchargedLinksSettings"
import { Prec } from "@codemirror/state";
import { buildCMViewPlugin, metadataRefreshCompartment, metadataRefreshFacet } from "./src/linkAttributes/livePreview";

export default class SuperchargedLinks extends Plugin {
	settings: SuperchargedLinksSettings;
	settingTab: SuperchargedLinksSettingTab
	private observers: [MutationObserver, string, string][];
	private modalObservers: MutationObserver[] = [];

	async onload(): Promise<void> {
		console.log('Supercharged links loaded');
		await this.loadSettings();

		this.addSettingTab(new SuperchargedLinksSettingTab(this.app, this));

			// Initialize cumulative service after settings are loaded
			initializeCumulativeLinkService(this.settings);

		this.registerMarkdownPostProcessor((el, ctx) => {
			updateElLinks(this.app, this, el, ctx)
		});

		const plugin = this;
		const updateLinks = function(_file: TFile) {
			updateVisibleLinks(plugin.app, plugin);
			plugin.observers.forEach(([observer, type, own_class]) => {
				// Some observers are registered with an index suffix (e.g., 'file-explorer0').
				// Strip trailing digits to get the actual view type.
				const baseType = type.replace(/\d+$/,'');
				const leaves = plugin.app.workspace.getLeavesOfType(baseType);
				leaves.forEach(leaf => {
					// Guard: skip when selector is empty to avoid querySelectorAll('') errors
					if (own_class && own_class.trim().length > 0) {
						plugin.updateContainer(leaf.view.containerEl, plugin, own_class);
					}
				})
			});
		}

		// Live preview
		const ext = Prec.lowest(buildCMViewPlugin(this.app, this.settings));
		// allows the plugin to trigger link decoration updates when metadata changes
		this.registerEditorExtension([metadataRefreshCompartment.of(metadataRefreshFacet.of(0)), ext]);

		this.observers = [];

		this.app.workspace.onLayoutReady(() => {
			this.initViewObservers(this);
			this.initModalObservers(this, document);
			updateVisibleLinks(this.app, this);
		});

		// Initialization
		this.registerEvent(this.app.workspace.on("window-open", (window, win) => this.initModalObservers(this, window.getContainer().doc)));

		// Update when
		// Debounced to prevent lag when writing
		// Use trailing debounce so updates run after metadata cache settles (fixes stale tab/file-explorer styles)
		this.registerEvent(this.app.metadataCache.on('changed', debounce((file) => {
			// Signal CM6 to recompute link decorations (wikilinks) without typing
			const markdownLeaves = this.app.workspace.getLeavesOfType('markdown');
			for (const leaf of markdownLeaves) {
				const view = leaf.view as any;
				if (view?.editor?.cm?.state) {
					const s = view.editor.cm.state;
					const current = s.facet(metadataRefreshFacet);
					view.editor.cm.dispatch({
						effects: metadataRefreshCompartment.reconfigure(metadataRefreshFacet.of(current + 1))
					});
				}
			}
			updateLinks(file);
		}, 500, false)));

		// Update when layout changes
		// @ts-ignore
		this.registerEvent(this.app.workspace.on("layout-change", debounce(updateLinks, 10, true)));
		// Update plugin views when layout changes
		// TODO: This is an expensive operation that seems like it is called fairly frequently. Maybe we can do this more efficiently?
		this.registerEvent(this.app.workspace.on("layout-change", () => this.initViewObservers(this)));

		// DEBUG: When adding a new view, to get the proper id of that view, uncomment this and reload the plugin
		// this.app.workspace.iterateAllLeaves(leaf => {
		// 	console.log(leaf.view.getViewType());
		// });
	}

	initViewObservers(plugin: SuperchargedLinks) {
		// Reset observers
		plugin.observers.forEach(([observer, type]) => {
			observer.disconnect();
		});
		plugin.observers = [];

		// Register new observers for particular file panes
		plugin.registerViewType('backlink', plugin, ".tree-item-inner", true);
		plugin.registerViewType('outgoing-link', plugin, ".tree-item-inner", true);
		plugin.registerViewType('search', plugin, ".tree-item-inner");
		if (plugin.app?.plugins?.plugins?.breadcrumbs) {
			// console.log('Supercharged links: Enabling breadcrumbs support');
			plugin.registerViewType('bc-matrix-view', plugin, 'span.internal-link');
			plugin.registerViewType('BC-ducks', plugin, '.internal-link');
			plugin.registerViewType('bc-tree-view', plugin, 'span.internal-link');
			// Breadcrumbs codeblock support as suggested by https://github.com/mdelobelle/obsidian_supercharged_links/issues/248#issuecomment-3231706063
			plugin.registerViewType('markdown', plugin, '.BC-page-views span.internal-link, .BC-codeblock-tree span.internal-link, .nodes a.internal-link');
		}
		plugin.registerViewType('graph-analysis', plugin, '.internal-link');
		plugin.registerViewType('starred', plugin, '.nav-file-title-content');
		plugin.registerViewType('file-explorer', plugin, '.nav-file-title-content');

		if (plugin.app?.plugins?.plugins?.['folder-notes']) {
			// console.log('Supercharged links: Enabling folder notes support');
			plugin.registerViewType('file-explorer', plugin, '.has-folder-note .tree-item-inner');
		}

		plugin.registerViewType('recent-files', plugin, '.nav-file-title-content');
		plugin.registerViewType('bookmarks', plugin, '.tree-item-inner', false, true);
		// @ts-ignore
		if (plugin.app?.internalPlugins?.plugins?.bases?.enabled && plugin.settings.enableBases) {
			// console.log('Supercharged links: Enabling bases support');
			plugin.registerViewType('bases', plugin, 'a.internal-link');
			plugin.registerViewType('bases', plugin, '.internal-link > .multi-select-pill-content');

			// For embedded bases
			plugin.registerViewType('markdown', plugin, 'div.bases-table-cell a.internal-link');
			plugin.registerViewType('markdown', plugin, 'div.bases-table-cell .internal-link > .multi-select-pill-content');
		}
		if (plugin.app?.plugins?.plugins?.['similar-notes']) {
			plugin.registerViewType('markdown', plugin, '.similar-notes-pane .tree-item-inner', true)
		}
		// If backlinks in editor is on
		// @ts-ignore
		if (plugin.app?.internalPlugins?.plugins?.backlink?.enabled && plugin.app?.internalPlugins?.plugins?.backlink?.instance?.options?.backlinkInDocument) {
			// console.log("Supercharged links: Enabling backlinks in document support");
			plugin.registerViewType('markdown', plugin, '.embedded-backlinks .tree-item-inner', true);
		}
		const propertyLeaves = this.app.workspace.getLeavesOfType("file-properties");
		for (let i = 0; i < propertyLeaves.length; i++) {
			const container = propertyLeaves[i].view.containerEl;
			let observer = new MutationObserver((records, _) =>{
				const file = this.app.workspace.getActiveFile();
				if (!!file) {
					updatePropertiesPane(container, this.app.workspace.getActiveFile(), this.app, plugin);
				}
			});
			observer.observe(container, {subtree: true, childList: true, attributes: false});
			plugin.observers.push([observer, "file-properties" + i, ""]);
			// TODO: No proper unloading!
		}
		plugin.registerViewType('file-properties', plugin, 'div.internal-link > .multi-select-pill-content');
		if (plugin.app?.plugins?.plugins?.['notebook-navigator']) {
			plugin.registerViewType('notebook-navigator', plugin, 'span.nn-shortcut-label');
			plugin.registerViewType('notebook-navigator', plugin, 'div.nn-file-name');
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
							let selector = ".suggestion-title, .suggestion-note, .another-quick-switcher__item__title, .omnisearch-result__title > span";
							// @ts-ignore
							if (n.className.includes('suggestion-container')) {
								selector = ".suggestion-title, .suggestion-note";
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

	registerViewType(viewTypeName: string, plugin: SuperchargedLinks, selector: string, updateDynamic = false, filter_collapsible: boolean = false) {
		const leaves = this.app.workspace.getLeavesOfType(viewTypeName);
		// if (leaves.length > 1) {
		 for (let i = 0; i < leaves.length; i++) {
			const container = leaves[i].view.containerEl;
			if (updateDynamic) {
				plugin._watchContainerDynamic(viewTypeName + i, container, plugin, selector)
			}
			 else {
				plugin._watchContainer(viewTypeName + i, container, plugin, selector, filter_collapsible);
			}
		 }
		// }
		// else if (leaves.length < 1) return;
		// else {
		// 	const container = leaves[0].view.containerEl;
		// 	this.updateContainer(container, plugin, selector);
		// 	if (updateDynamic) {
		// 		plugin._watchContainerDynamic(viewTypeName, container, plugin, selector)
		// 	}
		// 	else {
		// 		plugin._watchContainer(viewTypeName, container, plugin, selector);
		// 	}
		// }
	}

	updateContainer(container: HTMLElement, plugin: SuperchargedLinks, selector: string, filter_collapsible: boolean = false) {
		if (!plugin.settings.enableBacklinks && container.getAttribute("data-type") !== "file-explorer") return;
		if (!plugin.settings.enableFileList && container.getAttribute("data-type") === "file-explorer") return;
		const nodes = container.findAll(selector);
		for (let i = 0; i < nodes.length; ++i) {
			const el = nodes[i] as HTMLElement;
			updateDivExtraAttributes(plugin.app, plugin.settings, el, "", undefined, filter_collapsible);
		}
	}

	removeFromContainer(container: HTMLElement, selector: string) {
		const nodes = container.findAll(selector);
		for (let i = 0; i < nodes.length; ++i) {
			const el = nodes[i] as HTMLElement;
			clearExtraAttributes(el);
		}
	}

	_watchContainer(viewType: string, container: HTMLElement, plugin: SuperchargedLinks, selector: string, filter_collapsible: boolean = false) {
		let observer = new MutationObserver((records, _) => {
			plugin.updateContainer(container, plugin, selector, filter_collapsible);
		});
		observer.observe(container, { subtree: true, childList: true, attributes: false });
		if (viewType) {
			plugin.observers.push([observer, viewType, selector]);
		}
	}

	_watchContainerDynamic(viewType: string, container: HTMLElement, plugin: SuperchargedLinks, selector: string, parent_class = 'tree-item') {
		// Used for efficient updating of the backlinks panel
		// Only loops through newly added DOM nodes instead of changing all of them
		if (!plugin.settings.enableBacklinks) return;
		let observer = new MutationObserver((records, _) => {
			records.forEach((mutation) => {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach((n) => {
						if ('className' in n) {
							// @ts-ignore
							if (n.className.includes && typeof n.className.includes === 'function' && n.className.includes(parent_class)) {
								const fileDivs = (n as HTMLElement).findAll(selector);
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
		this.observers.forEach(([observer, type, own_class]) => {
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

			// Ensure runtime service sees updated settings
			updateCumulativeLinkService(this.settings);

	}

	async saveSettings() {
		await this.saveData(this.settings);

			// Ensure runtime service sees updated settings after save
			updateCumulativeLinkService(this.settings);

	}
}

