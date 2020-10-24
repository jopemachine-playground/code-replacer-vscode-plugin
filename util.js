// const fs = require('fs')
// const path = require('path')
const vscode = require('vscode')

module.exports = {
  getProperties: function (object) {
    let result = ''
    for (const key of Object.keys(object)) {
      result += `${key}=${object[key]}
`
    }
    return result
  },

  getInput ({ placeHolder, validateInput, prompt }) {
    return new Promise((resolve, reject) => {
      vscode.window
        .showInputBox({
          placeHolder,
          validateInput,
          ignoreFocusOut: true,
          prompt: true
        })
        .then((input) => {
          resolve(input)
        })
    })
  },

  getQuickPick ({ items, canPickMany, placeHolder }) {
    return new Promise((resolve, reject) => {
      vscode.window
        .showQuickPick(items, {
          canPickMany,
          placeHolder,
          ignoreFocusOut: true
        })
        .then((selection) => {
          resolve(selection)
        })
    })
  },

  replaceAll (str, searchStr, replaceStr) {
    return str.split(searchStr).join(replaceStr)
  }
}
