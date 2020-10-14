const path = require("path");
const recursive = require("recursive-readdir");

module.exports = async function ({ dir, ext }) {
  return new Promise((resolve, reject) => {
    try {
      recursive(path.resolve(dir), [], async (_err, files) => {
        const resultFiles = [];
        files.map((filePath) => {
          const targetFileName = filePath.split(path.sep).reverse()[0];
          if (targetFileName.split(".")[1] === ext) {
            resultFiles.push(filePath);
          }
        });

        resolve(resultFiles);
      });
    } catch (e) {
      reject(e);
    }
  });
};
