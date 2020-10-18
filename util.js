const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

module.exports = {
  getProperties: function (object) {
    let result = "";
    for (const key of Object.keys(object)) {
      result += `${key}=${object[key]}
`;
    }
    return result;
  },

  getInput({ placeHolder, validateInput }) {
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
  },

  getQuickPick({ items, canPickMany, placeHolder }) {
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
  },
};
