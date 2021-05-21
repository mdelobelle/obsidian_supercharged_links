import Field from "src/Field"

export interface SuperchargedLinksSettings {
	targetAttributes: Array<string>;
	presetFields: Array<Field>;
}

export const DEFAULT_SETTINGS: SuperchargedLinksSettings = {
	targetAttributes: [],
	presetFields: []
}