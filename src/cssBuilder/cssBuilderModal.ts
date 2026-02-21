import SuperchargedLinks from "main";
import { Modal, Setting } from "obsidian";
import {
  matchTypes,
  CSSLink,
  selectorType,
  SelectorTypes,
  MatchTypes,
} from "./cssLink";
import { SuperchargedLinksSettings } from "../settings/SuperchargedLinksSettings";
import { processKey } from "src/linkAttributes/linkAttributes";
import { t } from "src/i18n";

export function displayText(
  link: CSSLink,
  settings: SuperchargedLinksSettings,
): string {
  if (link.type === "tag") {
    if (!link.value) {
      return `<b>${t("display.chooseTag", "Please choose a tag")}</b>`;
    }
    return `<span class="data-link-icon data-link-text data-link-icon-after" data-link-tags="${link.value}">${t("words.note", "Note")}</span> ${t("display.hasTag", "has tag")} <a class="tag">#${link.value}</a>`;
  } else if (link.type === "attribute") {
    if (settings.targetAttributes.length === 0) {
      return `<b>${t("display.noAttributesAdded", 'No attributes added to "Target attributes". Go to plugin settings to add them.')}</b>`;
    }
    if (!link.name) {
      return `<b>${t("display.chooseAttributeName", "Please choose an attribute name.")}</b>`;
    }
    if (!link.value) {
      return `<b>${t("display.chooseAttributeValue", "Please choose an attribute value.")}</b>`;
    }
    const mp: Record<MatchTypes, string> = {
      exact: t("matchPreview.exact", "with value"),
      contains: t("matchPreview.contains", "containing"),
      startswith: t("matchPreview.startswith", "starting with"),
      endswith: t("matchPreview.endswith", "ending with"),
      whiteSpace: t("matchPreview.whiteSpace", "containing"),
    };
    return `<span class="data-link-icon data-link-text data-link-icon-after" data-link-${link.name}="${link.value}">${t("words.note", "Note")}</span> ${t("display.hasAttribute", "has attribute")} <b>${link.name.replace(/-/g, " ")}</b> ${mp[link.match]} <b>${link.value}</b>.`;
  }
  if (!link.value) {
    return `<b>${t("display.choosePath", "Please choose a path.")}</b>`;
  }
  const mpp: Record<MatchTypes, string> = {
    exact: t("matchPreviewPath.exact", "is"),
    contains: t("matchPreviewPath.contains", "contains"),
    startswith: t("matchPreviewPath.startswith", "starts with"),
    endswith: t("matchPreviewPath.endswith", "ends with"),
    whiteSpace: t("matchPreviewPath.whiteSpace", "contains"),
  };
  return `${t("display.pathOfNote", "The path of the")} <span class="data-link-icon data-link-text data-link-icon-after" data-link-path="${link.value}">${t("words.note", "note")}</span> ${mpp[link.match]} <b>${link.value}</b>`;
}

export function updateDisplay(
  textArea: HTMLElement,
  link: CSSLink,
  settings: SuperchargedLinksSettings,
): boolean {
  let toDisplay: string = displayText(link, settings);
  let disabled = false;
  if (link.type === "tag") {
    if (!link.value) {
      disabled = true;
    }
  } else if (link.type === "attribute") {
    if (settings.targetAttributes.length === 0) {
      disabled = true;
    } else if (!link.name) {
      disabled = true;
    } else if (!link.value) {
      disabled = true;
    }
  } else {
    if (!link.value) {
      disabled = true;
    }
  }
  textArea.innerHTML = toDisplay;
  return disabled;
}

class CSSBuilderModal extends Modal {
  plugin: SuperchargedLinks;
  cssLink: CSSLink;
  saveCallback: (cssLink: CSSLink) => void;

  constructor(
    plugin: SuperchargedLinks,
    saveCallback: (cssLink: CSSLink) => void,
    cssLink: CSSLink = null,
  ) {
    super(plugin.app);
    this.cssLink = cssLink;
    if (!cssLink) {
      this.cssLink = new CSSLink();
    }
    this.plugin = plugin;
    this.saveCallback = saveCallback;
  }

  onOpen() {
    this.titleEl.setText(t("modal.title", "Select what links to style!"));
    // is tag
    const matchAttrPlaceholder = t(
      "placeholders.attrValue",
      "Attribute value to match.",
    );
    const matchTagPlaceholder = t(
      "placeholders.tagValue",
      "Note tag to match (without #).",
    );
    const matchPathPlaceholder = t(
      "placeholders.pathValue",
      "File path to match.",
    );
    const matchAttrTxt = t("labels.attrValue", "Attribute value");
    const matchTagTxt = t("labels.tag", "Tag");
    const matchPathTxt = t("labels.path", "Path");

    const cssLink = this.cssLink;
    const plugin = this.plugin;

    this.contentEl.addClass("supercharged-modal");

    // Type
    new Setting(this.contentEl)
      .setName(t("modal.typeOfSelector.name", "Type of selector"))
      .setDesc(
        t(
          "modal.typeOfSelector.desc",
          "Attributes selects YAML and DataView attributes, tags chooses the tags of a note, and path considers the name of the note including in what folder it is.",
        ),
      )
      .addDropdown((dc) => {
        Object.keys(selectorType).forEach((type: SelectorTypes) => {
          const label =
            type === "attribute"
              ? t("labels.attrValue", "Attribute value")
              : type === "tag"
                ? t("labels.tag", "Tag")
                : t("labels.path", "Path");
          dc.addOption(type, label);
          if (type === this.cssLink.type) {
            dc.setValue(type);
          }
        });
        dc.onChange((type: SelectorTypes) => {
          cssLink.type = type;
          updateContainer(cssLink.type);
          saveButton.setDisabled(
            updateDisplay(preview, this.cssLink, this.plugin.settings),
          );
        });
      });

    // attribute name
    const attrName = new Setting(this.contentEl)
      .setName(t("modal.attributeName.name", "Attribute name"))
      .setDesc(
        t(
          "modal.attributeName.desc",
          "What attribute to target? Make sure to first add target attributes to the settings at the top!",
        ),
      )
      .addDropdown((dc) => {
        plugin.settings.targetAttributes.forEach((attribute: string) => {
          const dom_attribute = processKey(attribute);
          dc.addOption(dom_attribute, attribute);
          if (dom_attribute === cssLink.name) {
            dc.setValue(dom_attribute);
          }
        });
        dc.onChange((name) => {
          cssLink.name = name;
          saveButton.setDisabled(
            updateDisplay(preview, cssLink, plugin.settings),
          );
        });
      });

    // attribute value
    const attrValue = new Setting(this.contentEl)
      .setName(t("modal.attributeValue.name", "Value to match"))
      .setDesc(t("modal.attributeValue.desc", "Value to match."))
      .addText((t) => {
        t.setValue(cssLink.value);
        t.onChange((value) => {
          cssLink.value = value;
          saveButton.setDisabled(
            updateDisplay(preview, cssLink, plugin.settings),
          );
        });
      });

    this.contentEl.createEl("h4", { text: t("modal.advanced", "Advanced") });
    // matching type
    const matchingType = new Setting(this.contentEl)
      .setName(t("modal.matchingType.name", "Matching type"))
      .setDesc(
        t(
          "modal.matchingType.desc",
          "How to compare the attribute or path with the given value.",
        ),
      )
      .addDropdown((dc) => {
        Object.keys(matchTypes).forEach((key: MatchTypes) => {
          dc.addOption(key, t(`matchTypes.${key}`, matchTypes[key]));
          if (key == cssLink.match) {
            dc.setValue(key);
          }
        });
        dc.onChange(
          (value: "exact" | "contains" | "startswith" | "endswith") => {
            cssLink.match = value;
            saveButton.setDisabled(
              updateDisplay(preview, cssLink, plugin.settings),
            );
          },
        );
      });

    // case sensitive
    const caseSensitiveTogglerContainer = new Setting(this.contentEl)
      .setName(t("modal.caseSensitive.name", "Case sensitive matching"))
      .setDesc(
        t(
          "modal.caseSensitive.desc",
          "Should the matching of the value be case sensitive?",
        ),
      )
      .addToggle((b) => {
        b.setValue(cssLink.matchCaseSensitive);
        b.onChange((value) => {
          cssLink.matchCaseSensitive = value;
          b.setDisabled(updateDisplay(preview, cssLink, plugin.settings));
        });
      });

    if (
      !this.cssLink.name &&
      this.plugin.settings.targetAttributes.length > 0
    ) {
      this.cssLink.name = this.plugin.settings.targetAttributes[0];
    }

    const updateContainer = function (type: SelectorTypes) {
      if (type === "attribute") {
        attrName.settingEl.show();
        attrValue.nameEl.setText(matchAttrTxt);
        attrValue.descEl.setText(matchAttrPlaceholder);
        matchingType.settingEl.show();
        caseSensitiveTogglerContainer.settingEl.show();
      } else if (type === "tag") {
        attrName.settingEl.hide();
        attrValue.nameEl.setText(matchTagTxt);
        attrValue.descEl.setText(matchTagPlaceholder);
        matchingType.settingEl.hide();
        caseSensitiveTogglerContainer.settingEl.hide();
      } else {
        attrName.settingEl.hide();
        attrValue.nameEl.setText(matchPathTxt);
        attrValue.descEl.setText(matchPathPlaceholder);
        matchingType.settingEl.show();
        caseSensitiveTogglerContainer.settingEl.show();
      }
    };

    new Setting(this.contentEl)
      .setName(t("modal.styleOptions.name", "Style options"))
      .setDesc(
        t(
          "modal.styleOptions.desc",
          "What styling options are active? Disabling options you won't use can improve performance slightly.",
        ),
      )
      .addToggle((comp) => {
        comp.onChange((value) => {
          cssLink.selectText = value;
        });
        comp.setValue(cssLink.selectText);
        comp.setTooltip(
          t("modal.styleOptions.text.tooltip", "Style link text"),
        );
      })
      .addToggle((comp) => {
        comp.onChange((value) => {
          cssLink.selectPrepend = value;
        });
        comp.setValue(cssLink.selectPrepend);
        comp.setTooltip(
          t("modal.styleOptions.prepend.tooltip", "Add content before link"),
        );
      })
      .addToggle((comp) => {
        comp.onChange((value) => {
          cssLink.selectAppend = value;
        });
        comp.setValue(cssLink.selectAppend);
        comp.setTooltip(
          t("modal.styleOptions.append.tooltip", "Add content after link"),
        );
      })
      .addToggle((comp) => {
        comp.onChange((value) => {
          cssLink.selectBackground = value;
        });
        comp.setValue(cssLink.selectBackground);
        comp.setTooltip(
          t(
            "modal.styleOptions.background.tooltip",
            "Add optional background or underline to link",
          ),
        );
      });

    this.contentEl.createEl("h4", { text: t("modal.result", "Result") });
    const modal = this;
    const saveButton = new Setting(this.contentEl)
      .setName(t("modal.preview", "Preview"))
      .setDesc("")
      .addButton((b) => {
        b.setButtonText(t("modal.save", "Save"));
        b.onClick(() => {
          modal.saveCallback(cssLink);
          modal.close();
        });
      });
    // generate button

    const preview = saveButton.nameEl;
    updateContainer(cssLink.type);
    saveButton.setDisabled(
      updateDisplay(preview, this.cssLink, this.plugin.settings),
    );
  }
}

export { CSSBuilderModal };
