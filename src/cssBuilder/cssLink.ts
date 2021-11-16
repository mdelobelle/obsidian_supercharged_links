interface CSSLink {
    isTag: boolean
    name: string
    value: string
    matchCaseSensitive: boolean
    match: 'exact' | 'contains' | 'startswith' | 'endswith'
    linksTypes: string[]
}

const linkTypes: Record<string, string[]> = {
    "backLinks": ["a.internal-link"],
    "outgoingLinks": ["a.internal-link"],
    "fileExplorer": ["div.nav-file-title-content"],
    "search": [".tree-item-inner"],
    "breadcrumb": ["div.internal-link", "td.internal-link"],
    "editor": ["span.cm-hmd-internal-link"]
}

const matchTypes: Record<string, string> = {
    'exact': "Exact word",
    'contains': "Contains this value",
    'whiteSpace': "Value within whitespace separated words",
    'startswith': "Start with this value",
    'endswith': "Ends with this value"
}

const matchSign: Record<string, string> = {
    'exact': "",
    'contains': "*",
    'startswith': "^",
    'endswith': "$",
    'whiteSpace': "~"
}

class CSSLink {
    constructor() {
        this.isTag = false
        this.name = ""
        this.value = ""
        this.matchCaseSensitive = false
        this.match = "exact"
        this.linksTypes = Object.keys(linkTypes)
    }

    render(): string {
        console.log(this.linksTypes.length == Object.keys(linkTypes).length)
        const selectedLinksTypes: string[] = []

        const instructions: string[] = ["/*Supercharged links styling\ncopy and paste this in your css snippet\n"]
        if (this.linksTypes.length == Object.keys(linkTypes).length) {
            // if everything is selected : a single css selector is needed
            console.log("been here")
            const instruction = `[data-link-${this.isTag ?
                "tags" : this.name}${matchSign[this.match]}="${this.isTag ? "#" : ""}${this.value}"${this.matchCaseSensitive ?
                    "" : " i"}]{\n    //put your styles here\n}\n`
            instructions.push(instruction)
        } else {
            // if not: create specific selectors
            console.log("been there")
            Object.keys(linkTypes).forEach(element => {
                if (this.linksTypes.contains(element)) {
                    selectedLinksTypes.push(...linkTypes[element])
                }
            });
            selectedLinksTypes.forEach(selector => {
                console.log("selector ", selector)
                const instruction = `${selector}[data-link-${this.isTag ?
                    "tags" : this.name}${matchSign[this.match]}="${this.isTag ? "#" : ""}${this.value}"${this.matchCaseSensitive ?
                        "" : " i"}]{\n"    //put your styles here\n}\n`
                instructions.push(instruction)
            })
        }

        return instructions.join('\n')
    }
}

export { linkTypes, matchTypes, CSSLink }