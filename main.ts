import { App, Editor, MarkdownView, Modal, Notice, Menu, Plugin, PluginSettingTab, SuggestModal, Setting, TFile, Vault } from 'obsidian';
import { fromPath } from "pdf2pic";

// Remember to rename these classes and interfaces!

interface ConvertPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: ConvertPluginSettings = {
	mySetting: 'default'
}

export default class ConvertPlugin extends Plugin {
	settings: ConvertPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('file-down', 'Import PDF as image', (event) => {
			new FileModal(this.app).open();
		});

		this.addCommand({
			id: "obsidian-pdf-to-images",
			name: "Import PDF as images to current file",
			callback: () => {
				new FileModal(this.app).open();
			}
		})

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


export class FileModal extends SuggestModal<TFile> {
	getSuggestions(query: string): TFile[] | Promise<TFile[]> {
		return this.app.vault.getFiles().filter(t => {
			return t.extension.toLowerCase() == "pdf" && t.name.toLowerCase().includes(query.toLowerCase());
		})
	}

	renderSuggestion(value: TFile, el: HTMLElement) {
		el.createEl("div", {text: value.name});
		el.createEl("small", {text: value.path});
	}
	onChooseSuggestion(item: TFile, evt: MouseEvent | KeyboardEvent) {
		const baseOptions = {
			density: 100, 
			preserveAspectRatio: true,
			format: "jpeg",
			saveFilename: item.basename,
			savePath: "",
		}
		const uri = this.app.vault.getResourcePath(item);
		const split = uri.split('/');
		var filepath = '';
		var savepath = '';
		for(let i = 3; i < split.length - 1; i++) {
			filepath += split[i] + "/";
		}

		savepath = decodeURI(filepath);
		filepath = decodeURI(filepath + item.name);

		baseOptions.savePath = savepath; 
		const convert = fromPath(filepath, baseOptions).bulk(-1);
		convert.then((imagesList) => {
			const currentDoc = this.app.workspace.getActiveViewOfType(MarkdownView);
			if(currentDoc) {
				this.app.vault.process(currentDoc.file!, data => {
					imagesList.forEach((f) => {
						data += `![[${f.name}|500]]\n`;
					})
					return data;
				});
				new Notice(`Successfully imported ${imagesList.length} pages`);

				
			}
		})
	}

}