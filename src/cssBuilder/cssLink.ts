export type MatchTypes = 'exact' | 'contains' | 'startswith' | 'endswith' | 'whiteSpace';
export type SelectorTypes = 'attribute' | 'tag' | 'path';
interface CSSLink {
    type: SelectorTypes
    name: string
    value: string
    matchCaseSensitive: boolean
    match: MatchTypes
}

const matchTypes: Record<MatchTypes, string> = {
    'exact': "Exact match",
    'contains': "Contains value",
    'whiteSpace': "Value within whitespace separated words",
    'startswith': "Starts with this value",
    'endswith': "Ends with this value"
}

const matchSign: Record<MatchTypes, string> = {
    'exact': "",
    'contains': "*",
    'startswith': "^",
    'endswith': "$",
    'whiteSpace': "~"
}

export const matchPreview: Record<MatchTypes, string> = {
    'exact': "with value",
    'contains': "containing",
    'whiteSpace': "containing",
    'startswith': "starting with",
    'endswith': "ending with"
}

export const matchPreviewPath: Record<MatchTypes, string> = {
    'exact': "is",
    'contains': "contains",
    'whiteSpace': "contains",
    'startswith': "starts with",
    'endswith': "ends with"
}

export const selectorType: Record<SelectorTypes, string> = {
    'attribute': 'Select with attribute value',
    'tag': 'Select with tag',
    'path': 'Select with note path'
}

class CSSLink {
    constructor() {
        this.type = 'attribute'
        this.name = ""
        this.value = ""
        this.matchCaseSensitive = false
        this.match = "exact"
        // this.linksTypes = Object.keys(linkTypes)
    }

    render(): string {
        // TODO
        // console.log(this.linksTypes.length == Object.keys(linkTypes).length)
        const selectedLinksTypes: string[] = []

        const instructions: string[] = ["/*Supercharged links styling\ncopy and paste this in your css snippet\n"]
        // if (this.linksTypes.length == Object.keys(linkTypes).length) {
        //     // if everything is selected : a single css selector is needed
        //     const instruction = `[data-link-${this.isTag ?
        //         "tags" : this.name}${matchSign[this.match]}="${this.isTag ? "#" : ""}${this.value}"${this.matchCaseSensitive ?
        //             "" : " i"}]{\n    //put your styles here\n}\n`
        //     instructions.push(instruction)
        // } else {
        //     // if not: create specific selectors
        //     Object.keys(linkTypes).forEach(element => {
        //         if (this.linksTypes.contains(element)) {
        //             selectedLinksTypes.push(...linkTypes[element])
        //         }
        //     });
        //     selectedLinksTypes.forEach(selector => {
        //         console.log("selector ", selector)
        //         const instruction = `${selector}[data-link-${this.isTag ?
        //             "tags" : this.name}${matchSign[this.match]}="${this.isTag ? "#" : ""}${this.value}"${this.matchCaseSensitive ?
        //                 "" : " i"}]{\n"    //put your styles here\n}\n`
        //         instructions.push(instruction)
        //     })
        // }

        return instructions.join('\n')
    }
}

export { matchTypes, CSSLink }