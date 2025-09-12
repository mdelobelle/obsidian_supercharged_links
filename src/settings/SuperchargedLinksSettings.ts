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
	enableCumulative: boolean;
	enableBases: boolean;
	selectors: CSSLink[];
}

export const DEFAULT_SETTINGS: SuperchargedLinksSettings = {
	targetAttributes: [],
	targetTags: true,
	getFromInlineField: false,
	enableTabHeader: true,
	activateSnippet: true,
	enableEditor: true,
	enableFileList: true,
	enableBacklinks: true,
	enableQuickSwitcher: true,
	enableSuggestor: true,
	enableCumulative: false, // Default to false for backward compatibility
	enableBases: true,
	selectors: []
}