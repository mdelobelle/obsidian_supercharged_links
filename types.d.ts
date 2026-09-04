import "obsidian";
import { DataviewAPI } from "obsidian-dataview";

declare module "obsidian" {
    interface App {
        plugins: {
            enabledPlugins: Set<string>;
            plugins: {
                [id: string]: unknown;
                dataview?: {
                    api?: DataviewAPI;
                };
            };
        };
        internalPlugins: {
            plugins: {
                [id: string]: {
                    enabled: boolean;
                    instance?: {
                        options?: Record<string, unknown>;
                    };
                };
                backlink?: {
                    enabled: boolean;
                    instance?: {
                        options?: { backlinkInDocument?: boolean };
                    };
                };
            };
        };
        customCss: {
            enabledSnippets: Set<string>;
            requestLoadSnippets(): void;
        };
    }
    interface MetadataCache {
        on(
            name: "dataview:api-ready",
            callback: (api: DataviewAPI) => unknown,
            ctx?: unknown
        ): EventRef;
        on(
            name: "dataview:metadata-change",
            callback: (
                ...args:
                    | [op: "rename", file: TAbstractFile, oldPath: string]
                    | [op: "delete", file: TFile]
                    | [op: "update", file: TFile]
            ) => unknown,
            ctx?: unknown
        ): EventRef;
    }
}
