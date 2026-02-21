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

export function t(key: string, fallback?: string): string {
  const lang = getLang();
  const dict = lang === "zh" ? zh : en;
  return (dict as any)[key] ?? (en as any)[key] ?? fallback ?? key;
}
