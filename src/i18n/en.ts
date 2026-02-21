export default {
  "sections.styling": "Styling",
  "sections.settings": "Settings",
  "sections.advanced": "Advanced",
  "settings.targetAttributes.name": "Target Attributes for styling",
  "settings.targetAttributes.desc":
    "Frontmatter attributes to target, comma separated",
  "settings.enableEditor.name": "Enable in Editor",
  "settings.enableEditor.desc":
    "If true, this will also supercharge internal links in the editor view of a note.",
  "settings.enableTabHeader.name": "Enable in tab headers",
  "settings.enableTabHeader.desc":
    "If true, this will also supercharge the headers of a tab.",
  "settings.enableFileList.name": "Enable in File Browser",
  "settings.enableFileList.desc":
    "If true, this will also supercharge the file browser.",
  "settings.enableBases.name": "Enable in Bases",
  "settings.enableBases.desc":
    "If true, this will also supercharge Obsidian Bases.",
  "settings.enableBacklinks.name": "Enable in Plugins",
  "settings.enableBacklinks.desc":
    "If true, this will also supercharge plugins like the backlinks and forward links panels.",
  "settings.enableQuickSwitcher.name": "Enable in Quick Switcher",
  "settings.enableQuickSwitcher.desc":
    "If true, this will also supercharge the quick switcher.",
  "settings.enableSuggestor.name": "Enable in Link Autocompleter",
  "settings.enableSuggestor.desc":
    "If true, this will also supercharge the link autocompleter.",
  "settings.targetTags.name": "Parse all tags in the file",
  "settings.targetTags.desc":
    "Sets the `data-link-tags`-attribute to look for tags both in the frontmatter and in the file as #tag-name",
  "settings.getFromInlineField.name":
    "Search for attribute in Inline fields like <field::>",
  "settings.getFromInlineField.desc":
    "Sets the `data-link-<field>`-attribute to the value of inline fields",
  "settings.activateSnippet.name": "Automatically activate snippet",
  "settings.activateSnippet.desc":
    'If true, this will automatically activate the generated CSS snippet "supercharged-links-gen.css". Turn this off if you don\'t want this to happen.',
  "settings.deprecatedMenu.name": "Display field options in context menu",
  "settings.deprecatedMenu.desc":
    "This feature has been migrated to metadata-menu plugin https://github.com/mdelobelle/metadatamenu",
  "selectors.new.name": "New selector",
  "selectors.new.desc": "Create a new selector to style with Style Settings.",
  "selectors.button.new": "New",
  "selectors.tooltip.moveDown": "Move selector down",
  "selectors.tooltip.moveUp": "Move selector up",
  "selectors.tooltip.edit": "Edit selector",
  "selectors.tooltip.remove": "Remove selector",
  "styling.helper.html":
    "Styling can be done using the Style Settings plugin. <ol><li>Create selectors down below.</li><li>Go to the Style Settings tab and style your links!</li></ol>",
  "modal.title": "Select what links to style!",
  "modal.typeOfSelector.name": "Type of selector",
  "modal.typeOfSelector.desc":
    "Attributes selects YAML and DataView attributes, tags chooses the tags of a note, and path considers the name of the note including in what folder it is.",
  "modal.attributeName.name": "Attribute name",
  "modal.attributeName.desc":
    "What attribute to target? Make sure to first add target attributes to the settings at the top!",
  "modal.attributeValue.name": "Value to match",
  "modal.attributeValue.desc": "Value to match.",
  "modal.advanced": "Advanced",
  "modal.matchingType.name": "Matching type",
  "modal.matchingType.desc":
    "How to compare the attribute or path with the given value.",
  "modal.caseSensitive.name": "Case sensitive matching",
  "modal.caseSensitive.desc":
    "Should the matching of the value be case sensitive?",
  "modal.styleOptions.name": "Style options",
  "modal.styleOptions.desc":
    "What styling options are active? Disabling options you won't use can improve performance slightly.",
  "modal.styleOptions.text.tooltip": "Style link text",
  "modal.styleOptions.prepend.tooltip": "Add content before link",
  "modal.styleOptions.append.tooltip": "Add content after link",
  "modal.styleOptions.background.tooltip":
    "Add optional background or underline to link",
  "modal.result": "Result",
  "modal.preview": "Preview",
  "modal.save": "Save",
  "placeholders.attrValue": "Attribute value to match.",
  "placeholders.tagValue": "Note tag to match (without #).",
  "placeholders.pathValue": "File path to match.",
  "labels.attrValue": "Attribute value",
  "labels.tag": "Tag",
  "labels.path": "Path",
  "matchTypes.exact": "Exact match",
  "matchTypes.contains": "Contains value",
  "matchTypes.whiteSpace": "Value within whitespace separated words",
  "matchTypes.startswith": "Starts with this value",
  "matchTypes.endswith": "Ends with this value",
  "words.note": "Note",
  "display.chooseTag": "Please choose a tag",
  "display.noAttributesAdded":
    'No attributes added to "Target attributes". Go to plugin settings to add them.',
  "display.chooseAttributeName": "Please choose an attribute name.",
  "display.choosePath": "Please choose a path.",
  "display.hasTag": "has tag",
  "display.hasAttribute": "has attribute",
  "display.withValue": "with value",
  "display.pathOfNote": "The path of the",
  "matchPreview.exact": "with value",
  "matchPreview.contains": "containing",
  "matchPreview.whiteSpace": "containing",
  "matchPreview.startswith": "starting with",
  "matchPreview.endswith": "ending with",
  "matchPreviewPath.exact": "is",
  "matchPreviewPath.contains": "contains",
  "matchPreviewPath.whiteSpace": "contains",
  "matchPreviewPath.startswith": "starts with",
  "matchPreviewPath.endswith": "ends with",
};
