import {App, TFile, Modal} from "obsidian"

export default class FrontMatterPropertyUpdateModal extends Modal {
    private promptEl: HTMLInputElement;
    private resolve: (value: string) => void;
    private reject: (reason?: any) => void;
    private submitted: boolean = false;

	constructor(app: App, private file: TFile, private property: string, private value: any) {
		super(app);
	}

    onOpen(): void {
        this.titleEl.setText(`Update ${this.property}`);
        this.createForm();
    }

    onClose(): void {
        this.contentEl.empty();
        if (!this.submitted) {
            console.log("il ne s'est rien passé");
        }
    }



    createForm(): void {
        const div = this.contentEl.createDiv({
			cls: "frontmatter-prompt-div"
		})
        const form = div.createEl("form")
        form.addClass("frontmatter-prompt-form")
        form.type = "submit";
        form.onsubmit = (e: Event) => {
            this.submitted = true
            e.preventDefault()
            this.replaceFrontmatterAttribute(this.file, this.property, this.promptEl.value)
            this.close()
        }
		if(String.isString(this.value) || Number.isNumber(this.value)){
			this.promptEl = form.createEl("input")
			this.promptEl.type = "text"
			this.promptEl.placeholder = "Type value here...";
			this.promptEl.value = this.value.toString()
			this.promptEl.addClass("frontmatter-prompt-input")
		}
		else if(Array.isArray(this.value)) {
			this.promptEl = form.createEl("input")
			this.promptEl.type = "text"
			this.promptEl.placeholder = "Type value here...";
			this.promptEl.value = this.value.join(', ')
			this.promptEl.addClass("frontmatter-prompt-input")
		}
		else if(isBoolean(this.value)){
			div.addClass('frontmatter-checkbox-toggler')
			this.promptEl = form.createEl("input")
			this.promptEl.type = "checkbox"
			this.promptEl.checked = this.value
			this.promptEl.addClass("frontmatter-prompt-checkbox")
			let checkbox = div.createDiv({
				cls: 'checkbox-container'
			})
			if(this.value){checkbox.addClass('is-enabled')}
			checkbox.onClickEvent((evt: MouseEvent) => {
					this.promptEl.checked = !this.promptEl.checked
					this.promptEl.value = this.promptEl.checked ? "true" : "false"
					!this.promptEl.checked ? checkbox.removeClass('is-enabled') : checkbox.addClass('is-enabled')
					this.replaceFrontmatterAttribute(this.file, this.property, this.promptEl.value)
				})
		}
        this.promptEl.select()
    }

	async replaceFrontmatterAttribute(file: TFile, attribute: string, input: string): Promise <void>{
		this.app.vault.read(file).then(result => {
			let newContent:Array<string> = []
			result.split('\n').map(line => {
				const regex = new RegExp(`${attribute}:`)
				const regexResult = line.match(regex)
				if(regexResult && regexResult.length > 0){
					const inputArray = input ? input.replace(/(\,\s+)/g, ',').split(',') : [""]
					const newValue = inputArray.length == 1 ? inputArray[0] : `[${inputArray.join(', ')}]`
					newContent.push(`${attribute}: ${newValue}`)
				} else {
					newContent.push(`${line}`)
				}
				this.app.vault.modify(file, newContent.join('\n'))
			})
		})
	}

    async openAndGetValue(resolve: (value: string) => void, reject: (reason?: any) => void): Promise<void> {
        this.resolve = resolve;
        this.reject = reject;
        this.open();
    }
}