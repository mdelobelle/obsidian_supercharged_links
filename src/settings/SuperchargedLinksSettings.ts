import { CSSLink } from "../cssBuilder/cssLink";

export interface SuperchargedLinksSettings {
	targetAttributes: Array<string>;
	targetTags: boolean;
	getFromInlineField: boolean;
	activateSnippet: boolean;
	enableEditor: boolean;
	enableTabHeaders: boolean;
	enableFileList: boolean;
	enableBacklinks: boolean;
	enableQuickSwitcher: boolean;
	enableSuggestor: boolean;
	selectors: CSSLink[];
}

export const DEFAULT_SETTINGS: SuperchargedLinksSettings = {
	targetAttributes: [],
	targetTags: true,
	getFromInlineField: true,
	enableTabHeaders: true,
	activateSnippet: true,
	enableEditor: true,
	enableFileList: true,
	enableBacklinks: true,
	enableQuickSwitcher: true,
	enableSuggestor: true,
	selectors: []
}