// Mock for Obsidian API
export class TFile {
    path: string;
    basename: string;
    
    constructor(path: string) {
        this.path = path;
        this.basename = path.split('/').pop()?.replace('.md', '') || '';
    }
}

export class App {
    metadataCache = {
        getFileCache: jest.fn(),
        getFirstLinkpathDest: jest.fn(),
        on: jest.fn()
    };
    
    plugins = {
        enabledPlugins: new Set<string>(),
        plugins: {}
    };
    
    workspace = {
        iterateRootLeaves: jest.fn()
    };
}

export class MarkdownView {
    file: TFile | null = null;
    containerEl = {
        querySelectorAll: jest.fn(() => [])
    };
}

export interface LinkCache {
    link: string;
    original: string;
    displayText?: string;
}

export interface MarkdownPostProcessorContext {
    sourcePath: string;
}

export function getAllTags(cache: any): string[] {
    return cache?.tags || [];
}

export function getLinkpath(linkName: string): string {
    return linkName;
}

// Mock HTMLElement for testing
export class MockHTMLElement {
    private classes: Set<string> = new Set();
    private attributes: Map<string, string> = new Map();
    private styles: Map<string, string> = new Map();
    
    textContent: string | null = null;
    parentElement: MockHTMLElement | null = null;
    nextElementSibling: MockHTMLElement | null = null;
    children: MockHTMLElement[] = [];
    
    addClass(className: string) {
        this.classes.add(className);
    }
    
    hasClass(className: string): boolean {
        return this.classes.has(className);
    }
    
    removeClass(className: string) {
        this.classes.delete(className);
    }
    
    getAttribute(name: string): string | null {
        return this.attributes.get(name) || null;
    }
    
    setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
    }
    
    removeAttribute(name: string) {
        this.attributes.delete(name);
    }
    
    get style() {
        return {
            setProperty: (name: string, value: string) => {
                this.styles.set(name, value);
            },
            removeProperty: (name: string) => {
                this.styles.delete(name);
            }
        };
    }
    
    querySelectorAll(selector: string): MockHTMLElement[] {
        return [];
    }
    
    getClasses(): string[] {
        return Array.from(this.classes);
    }
    
    getAttributes(): Map<string, string> {
        return new Map(this.attributes);
    }
    
    getStyles(): Map<string, string> {
        return new Map(this.styles);
    }
}

// Replace HTMLElement with our mock in tests
(global as any).HTMLElement = MockHTMLElement;
