import Field from "src/Field"

export interface SuperchargedLinksSettings {
	targetAttributes: Array<string>;
	presetFields: Array<Field>;
	displayFieldsInContextMenu: boolean;
}

export const DEFAULT_SETTINGS: SuperchargedLinksSettings = {
	targetAttributes: [],
	presetFields: [],
	displayFieldsInContextMenu: true
}