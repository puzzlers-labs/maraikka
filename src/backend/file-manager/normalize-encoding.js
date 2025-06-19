const { CHARDET_ENCODING_MAP } = require("@constants/file");

function normaliseEncoding(encoding) {
  if (!encoding) return "binary";
  const key = encoding.trim().replace(/_/g, "-");
  return CHARDET_ENCODING_MAP[key] || "binary";
}

module.exports = { normaliseEncoding };
