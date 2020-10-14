// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const { interfaces } = require('mocha');
const vscode = require('vscode');
const path = require("path");
const findFiles = require("./findFiles");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */

function getInput({ placeHolder, validateInput }) {
  return new Promise((resolve, reject) => {
    vscode.window
      .showInputBox({
		placeHolder,
		validateInput
      })
      .then((input) => {
		resolve(input)
      })
  });
}

function validateTemplate(template) {
	return template.includes('->')
}

function getQuickPick({ items, canPickMany, placeHolder }) {
  return new Promise((resolve, reject) => {
    vscode.window
      .showQuickPick(items, {
        canPickMany,
        placeHolder,
      })
      .then((selection) => {
        resolve(selection);
      });
  });
}

const activate = (context) => {
	const disposable = vscode.commands.registerCommand('code-replacer-vscode-plugin.entry', async function () {
		const workspaceName = vscode.workspace.name;
		const workspacePath = vscode.workspace.rootPath;
		const csvFiles = await findFiles({
			dir: workspacePath,
			ext: 'csv',
		})
		const selectedCSV = await getQuickPick({ items: csvFiles, placeHolder: "Select your csv file." });

		const currentlyOpenTabfilePath = vscode.window.activeTextEditor.document.fileName;
		const currentlyOpenTabfileName = path.basename(currentlyOpenTabfilePath);

		const flags = {
			src: currentlyOpenTabfilePath,
			csv: selectedCSV,
		};
		
		flags.template = await getInput({ placeHolder: "Enter template or just enter if you dont need one." });
	});

	context.subscriptions.push(disposable);
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
