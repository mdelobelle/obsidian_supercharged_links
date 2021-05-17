interface FrontMatterProperty{
    propertyId: string
	propertyName: string
	presetValues: Record<string, string>
}

class FrontMatterProperty{
    public propertyId: string
	public propertyName: string
	public presetValues: Record<string, string>

	constructor(propertyName: string, presetValues: Record<string, string>, propertyId: string){
		this.propertyName = propertyName
		this.presetValues = presetValues
        this.propertyId = propertyId
        this.insertNewValue.bind(this)
	}

    public async insertNewValue(value:string): Promise<string>{
        let newKey = 1
        Object.keys(this.presetValues).forEach(key => {
            if(parseInt(key) && parseInt(key) >= newKey){
                newKey = parseInt(key) + 1
            }
        })
        this.presetValues[newKey.toString()] = value
        return newKey.toString()
    }

    static copyProperty(target: FrontMatterProperty, source: FrontMatterProperty){
        target.propertyId = source.propertyId
        target.propertyName = source.propertyName
        Object.keys(source.presetValues).forEach(k => {
            target.presetValues[k] = source.presetValues[k]
        })
        Object.keys(target.presetValues).forEach(k => {
            if(!Object.keys(source.presetValues).includes(k)){
                delete target.presetValues[k]
            }
        })
    }
}

export default FrontMatterProperty