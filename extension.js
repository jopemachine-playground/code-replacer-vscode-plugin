/* eslint-disable no-unused-vars */
const vscode = require('vscode')
const path = require('path')
const findFiles = require('./findFiles')
const fs = require('fs')
const { getProperties, getInput, getQuickPick } = require('./util')
const { UIString } = require('./constant')

// fetch setting value from vscode's settings
// See package.json's contributes's configuration
const maxLogDisplayCnt = vscode.workspace.getConfiguration().get('code.replacer.setting')

/**
 * @param {vscode.ExtensionContext} context
 */

function validateTemplate (template) {
  return template.includes('->')
}

function handleBooleanFlags () {
  const flagItems = [
    'print',
    'verbose',
    'conf',
    'once',
    'no-escape',
    'overwrite',
    'excludeReg',
    'startLine',
    'endLine'
  ]

  return new Promise((resolve, reject) => {
    vscode.window
      .showQuickPick(flagItems, {
        canPickMany: true,
        placeHolder: 'Check the flags to apply.'
      })
      .then((selection) => {
        resolve(selection)
      })
  })
}

async function handleTemplate ({ usageLogPath }) {
  const usageLogs = fetchLog({ jsonPath: usageLogPath, keyName: 'template' })
  const uiButtons = [
    ...usageLogs,
    UIString.TYPE_INPUT,
    UIString.EXIT
  ]
  const template = await getQuickPick({
    items: uiButtons,
    placeHolder: 'Check template to apply.'
  })

  if (template === UIString.TYPE_INPUT) {
    return await getInput({
      placeHolder: 'Enter template.',
      validateInput: (str) => {
        return !validateTemplate(str)
      }
    })
  } else if (template === UIString.EXIT) {
    return -1
  } else {
    return template
  }
}

const fetchLog = ({ jsonPath, keyName }) => {
  const logs = []
  const usageLogJson = require(jsonPath)

  let displayCnt = 0
  const maxDisplayCnt = maxLogDisplayCnt
  const keys = Object.keys(usageLogJson).reverse()
  for (const usageLogKey of keys) {
    if (
      usageLogJson[usageLogKey][keyName] &&
      !logs.includes(usageLogJson[usageLogKey][keyName]) &&
      displayCnt < maxDisplayCnt
    ) {
      logs.push(usageLogJson[usageLogKey][keyName])
      displayCnt++
    }
  }

  return logs
}

const activate = (context) => {
  const disposable = vscode.commands.registerCommand(
    'code-replacer-vscode-plugin.entry',
    async function () {
      if (
        !vscode.window.activeTextEditor ||
        !vscode.window.activeTextEditor.document
      ) {
        vscode.window.showErrorMessage(
          'Jobs canceled. open the source file first.'
        )
        return
      }

      const currentlyOpenTabfilePath =
        vscode.window.activeTextEditor.document.fileName

      const currentlyOpenTabfileName = path.basename(currentlyOpenTabfilePath)

      const codeReplacerPath = `${__dirname}${path.sep}node_modules${path.sep}code-replacer${path.sep}dist`
      const binPath = path.resolve(`${codeReplacerPath}${path.sep}index.js`)
      const envPath = path.resolve(`${codeReplacerPath}${path.sep}${'.env'}`)
      const usageLogPath = path.resolve(
        `${codeReplacerPath}${path.sep}usageLog.json`
      )
      const workspaceName = vscode.workspace.name
      const workspacePath = vscode.workspace.rootPath
      const csvFiles = await findFiles({
        dir: workspacePath,
        ext: 'csv'
      })

      const selectedCSV = await getQuickPick({
        items: [UIString.EXIT, ...csvFiles],
        placeHolder: 'Select your csv file or type esc to pass csv option.'
      })

      if (!selectedCSV) {
        vscode.window.showInformationMessage('csv option is passed.')
      } else if (selectedCSV === UIString.EXIT) {
        vscode.window.showInformationMessage(UIString.EXIT)
        return
      }

      const flags = {
        src: currentlyOpenTabfilePath,
        csv: selectedCSV
      }

      flags.template = await handleTemplate({ usageLogPath })

      if (!flags.template) {
        vscode.window.showErrorMessage(
          'Jobs canceled. template value is required argument.'
        )
        return
      } else if (flags.template === -1) {
        vscode.window.showInformationMessage(UIString.EXIT)
        return
      } else if (!validateTemplate(flags.template)) {
        vscode.window.showErrorMessage('Wrong template value. See README.md')
        return
      }

      const booleanFlags = await handleBooleanFlags()

      for (const booleanFlag of booleanFlags.values()) {
        flags[booleanFlag] = true
      }

      if (flags.excludeReg) {
        flags.excludeReg = await getInput({ placeHolder: 'Enter excludeReg.' })
      }

      if (flags.startLine) {
        flags.startLine = await getInput({ placeHolder: 'Enter startLine.' })
      }

      if (flags.endLine) {
        flags.endLine = await getInput({ placeHolder: 'Enter endLine.' })
      }

      const terminal = vscode.window.activeTerminal
        ? vscode.window.activeTerminal
        : vscode.window.createTerminal()
      terminal.show()

      const command = `node ${binPath}`

      fs.writeFile(
        envPath,
        getProperties(flags),
        {
          encoding: 'utf8'
        },
        () => {
          terminal.sendText(command)
        }
      )
    }
  )

  context.subscriptions.push(disposable)
}

exports.activate = activate

// this method is called when your extension is deactivated
function deactivate () {}

module.exports = {
  activate,
  deactivate
}
