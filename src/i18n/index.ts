import type { App } from "obsidian";
import en from "./en";
import zh from "./zh";

let appRef: App | null = null;

export function initI18n(app: App) {
  appRef = app;
}

function getLang(): "en" | "zh" {
  const l =
    ((appRef as any)?.i18n?.locale ||
      (appRef as any)?.i18n?.language ||
      (appRef as any)?.localization?.language ||
      (typeof navigator !== "undefined" ? navigator.language : "en") ||
      "en") as string;
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
  const lang = getLang();
  const dict = lang === "zh" ? zh : en;
  const template: string = (dict as any)[key] ?? (en as any)[key] ?? fallback ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match: string, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : match,
  );
}
