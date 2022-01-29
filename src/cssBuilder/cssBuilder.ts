import {CSSLink} from "./cssLink";

export function build(selectors: CSSLink[]) {
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