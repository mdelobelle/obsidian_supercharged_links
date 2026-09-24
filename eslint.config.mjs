import obsidianmd from "eslint-plugin-obsidianmd";

// Mirrors the automated scan behind the plugin's listing on
// community.obsidian.md, so findings can be reproduced with `npm run lint`.
export default [
	{
		ignores: ["main.js", "rollup.config.js", "eslint.config.mjs"],
	},
	...obsidianmd.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
];
