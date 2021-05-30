import FileClassAttribute from "./FileClassAttribute"
import {App, TFile} from "obsidian"
import SuperchargedLinks from "main"

interface FileClass{
    plugin: SuperchargedLinks
    name: string
    attributes: Array<FileClassAttribute>
    objects: FileClassManager
    errors: string[]
}

class FileClassManager{
    instance: FileClass

    constructor(instance: FileClass){
        this.instance = instance
    }

    all(){
        const filesWithFileClassName = this.instance.plugin.app.vault.getMarkdownFiles().filter(file => {
            const cache = this.instance.plugin.app.metadataCache.getFileCache(file)
            return cache.frontmatter 
                && Object.keys(cache.frontmatter).includes('fileClass')
                && cache.frontmatter['fileClass'] == this.instance.name
        })
        return filesWithFileClassName
    }

    get(name: string){
        const filesWithName = this.all().filter(file => file.basename == name)
        if(filesWithName.length > 1){
            const error = new Error("More than one value found")
            throw error
        }
        if (filesWithName.length == 0) {
            const error = new Error("No file value found")
            throw error
        }
        return filesWithName[0]

    }

    getPath(path: string){
        const filesWithName = this.all().filter(file => file.path == path)
        if(filesWithName.length > 1){
            const error = new Error("More than one value found")
            throw error
        }
        if (filesWithName.length == 0) {
            const error = new Error("No file value found")
            throw error
        }
        return filesWithName[0]

    }
}

class FileClass{
    constructor(plugin: SuperchargedLinks, name: string){
        this.plugin = plugin
        this.name = name,
        this.objects = new FileClassManager(this)
        this.attributes = []
    }

    getClassFile(){
        const filesClassPath = this.plugin.settings.classFilesPath
        const files = this.plugin.app.vault.getMarkdownFiles().filter(file => file.path == `${filesClassPath}${this.name}.md`)
        if(files.length == 0){
            const error = new Error("no such fileClass in fileClass folder")
            throw error
        } else {
            return files[0]
        }
    }

    getAttributes(): Promise<void>{
        return new Promise((resolve, reject) => {
            const file = this.getClassFile()
            let attributes: Array<FileClassAttribute> = []
            let errors: string[] = []
            this.plugin.app.vault.read(file).then(result => {
                result.split('\n').forEach(line => {
                    try {
                        const attribute = new FileClassAttribute(line)
                        attributes.push(attribute)
                    } catch (error) {
                        errors.push(error)
                    }
                })
                this.attributes = attributes
                this.errors = errors
                resolve()
            })
        })
    }
}

async function createFileClass(plugin: SuperchargedLinks, name: string): Promise<FileClass> {
    const fileClass = new FileClass(plugin, name);
    await fileClass.getAttributes()
    return fileClass;
}

export {createFileClass, FileClass}