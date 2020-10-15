const fs = require('fs')
const path = require('path')

module.exports = {
  getProperties: function (object) {
    let result = ''
    for (const key of Object.keys(object)) {
      result += `${key}=${object[key]}
`
    }
    return result
  }
}