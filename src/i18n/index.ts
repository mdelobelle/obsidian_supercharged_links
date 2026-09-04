import type { App } from "obsidian";
import en from "./en";
import zh from "./zh";

type Dictionary = Record<string, string>;

const dictionaries: Record<"en" | "zh", Dictionary> = { en, zh };

let appRef: (App & LocalizedApp) | null = null;

export function initI18n(app: App) {
  appRef = app;
}

/** Obsidian exposes the active locale on undocumented App members. */
interface LocalizedApp {
  i18n?: { locale?: string; language?: string };
  localization?: { language?: string };
}

function getLang(): "en" | "zh" {
  const l =
    appRef?.i18n?.locale ||
    appRef?.i18n?.language ||
    appRef?.localization?.language ||
    (typeof navigator !== "undefined" ? navigator.language : "en") ||
    "en";
  const low = l.toLowerCase();
  if (low.startsWith("zh")) return "zh";
  return "en";
}

/**
 * Look up `key` in the active dictionary, falling back to English and then to
 * `fallback`. Pass `vars` to fill `{placeholder}` slots: whole sentences are
 * translated as one string so that translations can reorder them, instead of
 * being glued together from fragments in English word order.
 */
export function t(
  key: string,
  fallback?: string,
  vars?: Record<string, string>,
): string {
  const dict = dictionaries[getLang()];
  const template: string = dict[key] ?? dictionaries.en[key] ?? fallback ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match: string, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : match,
  );
}
