import { CSSLink } from "../cssBuilder/cssLink";

export interface SuperchargedLinksSettings {
	targetAttributes: Array<string>;
	targetTags: boolean;
	getFromInlineField: boolean;
	activateSnippet: boolean;
	enableEditor: boolean;
	enableTabHeader: boolean;
	enableFileList: boolean;
	enableBacklinks: boolean;
	enableQuickSwitcher: boolean;
	enableSuggestor: boolean;
	selectors: CSSLink[];
	enableDynamicViewNameFormatting: boolean;
	dynamicViewNameFormat: string;
	dynamicViewNameFormatProperties: Array<string>;
}

export const DEFAULT_SETTINGS: SuperchargedLinksSettings = {
	targetAttributes: [],
	targetTags: true,
	getFromInlineField: true,
	enableTabHeader: true,
	activateSnippet: true,
	enableEditor: true,
	enableFileList: true,
	enableBacklinks: true,
	enableQuickSwitcher: true,
	enableSuggestor: true,
	selectors: [],
	enableDynamicViewNameFormatting: false,
	dynamicViewNameFormat: "{name}",
	dynamicViewNameFormatProperties: []
}