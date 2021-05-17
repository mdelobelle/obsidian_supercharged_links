import FrontMatterProperty from "src/FrontMatterProperty"

export interface SuperchargedLinksSettings {
	targetAttributes: Array<string>;
	presetFrontmatterProperties: Array<FrontMatterProperty>;
}

export const DEFAULT_SETTINGS: SuperchargedLinksSettings = {
	targetAttributes: [],
	presetFrontmatterProperties: []
}