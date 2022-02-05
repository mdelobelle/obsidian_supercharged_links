export type MatchTypes = 'exact' | 'contains' | 'startswith' | 'endswith' | 'whiteSpace';
export type SelectorTypes = 'attribute' | 'tag' | 'path';
interface CSSLink {
    type: SelectorTypes
    name: string
    value: string
    matchCaseSensitive: boolean
    match: MatchTypes
    uid: string
    selectText: boolean
    selectBackground: boolean
    selectAppend: boolean
    selectPrepend: boolean
}

const matchTypes: Record<MatchTypes, string> = {
    'exact': "Exact match",
    'contains': "Contains value",
    'whiteSpace': "Value within whitespace separated words",
    'startswith': "Starts with this value",
    'endswith': "Ends with this value"
}

export const matchSign: Record<MatchTypes, string> = {
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
    'attribute': 'Attribute value',
    'tag': 'Tag',
    'path': 'Note path'
}

class CSSLink {
    constructor() {
        this.type = 'attribute';
        this.name = "";
        this.value = "";
        this.matchCaseSensitive = false;
        this.match = "exact";
        let s4 = () => {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        //return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
        this.uid = s4() + "-" + s4();
        this.selectText = true;
        this.selectAppend = true;
        this.selectPrepend = true;
        this.selectBackground = true;
    }
}

export { matchTypes, CSSLink }