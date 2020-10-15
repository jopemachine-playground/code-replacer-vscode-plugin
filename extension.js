const vscode = require("vscode");
const path = require("path");
const findFiles = require("./findFiles");
const fs = require("fs");
const { getProperties, getInput, getQuickPick } = require("./util");
const { CLI_SELCTOR_MAX_DISPLAYING_LOG, UI_String } = require("./constant");

/**
 * @param {vscode.ExtensionContext} context
 */

function validateTemplate(template) {
  return template.includes("->");
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

async function handleTemplate ({ usageLogPath }) {
  const usageLogs = fetchLog({ jsonPath: usageLogPath, keyName: 'template' });
  const uiButtons = [
    ...usageLogs,
    UI_String.TYPE_INPUT,
  ];
  const template = await getQuickPick({ items: uiButtons, placeHolder: 'Check template to apply' })

  if (template === UI_String.TYPE_INPUT) {
    return await getInput({
      placeHolder: "Enter template",
    });
  } else {
    return template;
  }
}

const fetchLog = ({ jsonPath, keyName }) => {
  const logs = []
  const usageLogJson = require(jsonPath)

  let displayCnt = 0
  const maxDisplayCnt = CLI_SELCTOR_MAX_DISPLAYING_LOG
  for (const usageLogKey of Object.keys(usageLogJson)) {
    usageLogJson[usageLogKey][keyName] && (displayCnt++ < maxDisplayCnt) &&
    logs.push(usageLogJson[usageLogKey][keyName])
  }

  return logs
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

      flags.template = await handleTemplate({ usageLogPath });

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
