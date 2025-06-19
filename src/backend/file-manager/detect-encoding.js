const { CHARDET_CONFIDENCE_THRESHOLD } = require("@constants/file");

const {
  normaliseEncoding,
} = require("@backend/file-manager/normalize-encoding");

const chardet = require("chardet");
const { isBinaryFile } = require("isbinaryfile");

function detectEncoding(fileBuffer) {
  const { name, confidence } = chardet.analyse(fileBuffer)[0];

  if (confidence < CHARDET_CONFIDENCE_THRESHOLD) {
    if (isBinaryFile(fileBuffer)) {
      return "binary";
    }
  }

  return normaliseEncoding(name);
}

module.exports = { detectEncoding };
