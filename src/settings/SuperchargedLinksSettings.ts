import Field from "src/Field"
import {CSSLink} from "../cssBuilder/cssLink";

export interface SuperchargedLinksSettings {
	targetAttributes: Array<string>;
	targetTags: boolean;
	presetFields: Array<Field>;
	displayFieldsInContextMenu: boolean;
	globallyIgnoredFields: Array<string>;
	getFromInlineField: boolean;
	activateSnippet: boolean;
	classFilesPath: string;
	enableEditor: boolean;
	enableFileList: boolean;
	enableBacklinks: boolean;
	enableQuickSwitcher: boolean;
	enableSuggestor: boolean;
	enableGraph: boolean;
	selectors: CSSLink[];
}

export const DEFAULT_SETTINGS: SuperchargedLinksSettings = {
	targetAttributes: [],
	targetTags: true,
	presetFields: [],
	displayFieldsInContextMenu: true,
	globallyIgnoredFields: [],
	classFilesPath: "",
	getFromInlineField: true,
	activateSnippet: true,
	enableEditor: true,
	enableFileList: true,
	enableBacklinks: true,
	enableQuickSwitcher: true,
	enableSuggestor: true,
	enableGraph: true,
	selectors: []
}