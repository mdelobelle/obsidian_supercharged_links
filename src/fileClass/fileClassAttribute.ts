interface FileClassAttribute{
    name: string
    type: string
    values: string[]
    isMulti: boolean
    isCycle: boolean
}

class FileClassAttribute{

    constructor(raw: string){
        const completeRegex = new RegExp(/^[_\*~`]*([0-9\w\p{Letter}\p{Emoji_Presentation}][-0-9\w\p{Letter}\p{Emoji_Presentation}\s]*)[_\*~`]*\s*::(.+)?/u)
        const nameRegex = new RegExp(/^[_\*~`]*([0-9\w\p{Letter}\p{Emoji_Presentation}][-0-9\w\p{Letter}\p{Emoji_Presentation}\s]*)[_\*~`]*\s*$/u)
		const detailedFieldRaw = raw.match(completeRegex)
        const simpleFieldRaw = raw.match(nameRegex)
        if(detailedFieldRaw){
            this.name = detailedFieldRaw[1].trim()
        } else if(simpleFieldRaw){
            this.name = simpleFieldRaw[0].trim()
        } else {
            const error = new Error("Improper value")
            throw error
        }
    }
}

export default FileClassAttribute 