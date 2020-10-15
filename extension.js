const { interfaces } = require("mocha");
const vscode = require("vscode");
const path = require("path");
const findFiles = require("./findFiles");
const fs = require("fs");
const { getProperties } = require("./util");

/**
 * @param {vscode.ExtensionContext} context
 */

function getInput({ placeHolder, validateInput }) {
  return new Promise((resolve, reject) => {
    vscode.window
      .showInputBox({
        placeHolder,
        validateInput,
      })
      .then((input) => {
        resolve(input);
      });
  });
}

function validateTemplate(template) {
  return template.includes("->");
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

function handleBooleanFlags () {
  const flagItems = [
    'debug',
    'verbose',
    'conf',
    'once',
    'no-escape',
    'overwrite'
  ];

  return new Promise((resolve, reject) => {
    vscode.window
      .showQuickPick(flagItems, {
        canPickMany: true,
        placeHolder: 'Check the flags to apply',
      })
      .then((selection) => {
        resolve(selection);
      });
  });
}

const activate = (context) => {
  const disposable = vscode.commands.registerCommand(
    "code-replacer-vscode-plugin.entry",
    async function () {
      const codeReplacerPath = `${__dirname}${path.sep}${"node_modules"}${
        path.sep
      }${"code-replacer"}`;
      const binPath = path.resolve(
        `${codeReplacerPath}${path.sep}${"index.js"}`
      );
      const envPath = path.resolve(`${codeReplacerPath}${path.sep}${".env"}`);
      const usageLogPath = path.resolve(
        `${codeReplacerPath}${path.sep}${"usageLog.json"}`
      );
      const workspaceName = vscode.workspace.name;
      const workspacePath = vscode.workspace.rootPath;
      const csvFiles = await findFiles({
        dir: workspacePath,
        ext: "csv",
      });
      const selectedCSV = await getQuickPick({
        items: csvFiles,
        placeHolder: "Select your csv file.",
      });

      const currentlyOpenTabfilePath =
        vscode.window.activeTextEditor.document.fileName;
      const currentlyOpenTabfileName = path.basename(currentlyOpenTabfilePath);

      const flags = {
        src: currentlyOpenTabfilePath,
        csv: selectedCSV,
      };

      flags.template = await getInput({
        placeHolder: "Enter template or just enter if you dont need one.",
      });

      const booleanFlags = await handleBooleanFlags();
      for (const booleanFlag of booleanFlags.values()) {
        flags[booleanFlag] = true;
      }

      const terminal = vscode.window.activeTerminal
        ? vscode.window.activeTerminal
        : vscode.window.createTerminal();
      terminal.show();

      let command = `node ${binPath}`;

      fs.writeFile(
        envPath,
        getProperties(flags),
        {
          encoding: "utf8",
        },
        () => {
          terminal.sendText(command);
        }
      );
    }
  );

  context.subscriptions.push(disposable);
};

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
