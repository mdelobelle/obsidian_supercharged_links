import {Plugin, MarkdownView, Notice, debounce, TFile, TAbstractFile} from 'obsidian';
import SuperchargedLinksSettingTab from "src/settings/SuperchargedLinksSettingTab"
import {
	updateElLinks,
	updateVisibleLinks,
	clearExtraAttributes,
	updateDivExtraAttributes,
	fetchTargetAttributesSync,
} from "src/linkAttributes/linkAttributes"
import { SuperchargedLinksSettings, DEFAULT_SETTINGS } from "src/settings/SuperchargedLinksSettings"
import Field from 'src/Field';
import linkContextMenu from "src/options/linkContextMenu"
import NoteFieldsCommandsModal from "src/options/NoteFieldsCommandsModal"
import FileClassAttributeSelectModal from 'src/fileClass/FileClassAttributeSelectModal';
import { Prec } from "@codemirror/state";
import {buildCMViewPlugin} from "./src/linkAttributes/livePreview";
import {CSSLink} from "./src/cssBuilder/cssLink";

type GraphColor = {a: number, rgb: number};

export default class SuperchargedLinks extends Plugin {
	settings: SuperchargedLinksSettings;
	initialProperties: Array<Field> = []
	settingTab: SuperchargedLinksSettingTab
	private observers: [MutationObserver, string, string][];
	private modalObserver: MutationObserver;

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
			this.initModalObservers(this);
		});
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
		plugin.registerGraphViewType(plugin);
		// If backlinks in editor is on
		// @ts-ignore
		if (plugin.app?.internalPlugins?.plugins?.backlink?.instance?.options?.backlinkInDocument) {
			plugin.registerViewType('markdown', plugin, '.tree-item-inner', true);
		}
	}

	initModalObservers(plugin: SuperchargedLinks) {
		const config = {
			subtree: false,
			childList: true,
			attributes: false
		};

		this.modalObserver = new MutationObserver(records => {
			records.forEach((mutation) => {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach(n => {
						if ('className' in n &&
							// @ts-ignore
							(n.className.includes('modal-container') && plugin.settings.enableQuickSwitcher
								// @ts-ignore
								|| n.className.includes('suggestion-container') && plugin.settings.enableSuggestor)) {
							let selector = ".suggestion-item, .suggestion-note, .another-quick-switcher__item__title";
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
		});
		this.modalObserver.observe(document.body, config);
	}

	registerGraphViewType(plugin: SuperchargedLinks) {
		if (!plugin.settings.enableGraph) return;
		this.app.workspace.getLeavesOfType('graph')
			.map(leave => leave.view as any)
			.forEach(view => {
				// FIXME this lambda is invoked two times consequently, find out why and fix.
				//console.log(`Registering render callbacks for graph view ${view.contentEl.id}:`);
				//console.dir(view);

				const renderer = view.renderer;

				const app = plugin.app;
				const vault = app.vault;

				// Save current callback to call it during our redefined one.
				// FIXME this setup can chain our callback multiple times if called multiple times itself.
				// Maybe add some callback uniqueness check?
				const oldCallback = renderer.renderCallback;
				renderer.renderCallback = function() {
					// TODO this gets called way to often, we should minimize the amount of work done here.
					// Caching colors and/or matched rules for nodes should do the trick.
					// TBD: where to do this, where to store this and when to flush the cache.
					console.log('renderCallback...');
					// TODO add relevant typing for Graph View types
					// @ts-ignore
					renderer.nodes.forEach(node => {
						const file = vault.getAbstractFileByPath(node.id);
						if (node.color != null) {
							logGraphColor(node.color, `${node.id} original color: `);
						}
						plugin.settings.selectors.forEach(selector => {
							if (fileMatchesSelector(plugin, file, selector)) {
								// Get color set up by Style Settings.
								// Original colors are set at :root, but Style Settings
								// redefines them by styling `body.css-settings-manager`
								// FIXME CSS variable name is copy-pasted from cssBuilder,
								// maybe these properties should be abstracted away.
								const colorStr = getComputedStyle(document.body)
									.getPropertyValue(`--${selector.uid}-color`)
								logCssColor(colorStr, `${node.id} match, new color: `)
								node.color = colorCssToGraph(colorStr);
							}
						})
					})
					oldCallback(...arguments);
				}
			});
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
		this.modalObserver.disconnect();
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

// TODO move out this function elsewhere
function fileMatchesSelector(plugin: SuperchargedLinks, file: TAbstractFile, link: CSSLink): boolean {
	if (file instanceof TFile) {
		const attrs = fetchTargetAttributesSync(plugin.app, plugin.settings, file, true);
		return link.type == "path" && attrs["path"] == link.value ||
			link.type == "tag" && attrs["tags"].indexOf(link.value) != -1 ||
			link.type == "attribute" && false; // TODO handle attributes
	} else {
		return false;
	}
}

// TODO move out these two functions elsewhere
function colorGraphToCss(graphColor: GraphColor): string { return "#" + graphColor.rgb.toString(16); }
function colorCssToGraph(cssColor: string): GraphColor {
	return {a: 1, rgb: parseInt(cssColor.trim().substring(1), 16)};
}

// TODO remove these logging functions
function logCssColor(cssColor: string, prefix: string = '') { logColors(cssColor, this.colorCssToGraph(cssColor), prefix) }
function logGraphColor(graphColor: GraphColor, prefix: string = '') { logColors(this.colorGraphToCss(graphColor), graphColor, prefix) }
function logColors(cssColor: string, graphColor: GraphColor, prefix: string = '') {
	console.log("%s%ccss: %s, graph: %s", prefix, `color:${cssColor}`, cssColor, JSON.stringify(graphColor));
}