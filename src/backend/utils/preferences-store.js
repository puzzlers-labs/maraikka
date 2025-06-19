// Preferences Store Module
// Manages persistent application preferences using electron-store

const Store = require("electron-store");
const { THEMES, DEFAULT_THEME } = require("@constants/theme");

// Schema for preferences validation
const schema = {
  theme: {
    type: "string",
    enum: Object.values(THEMES),
    default: DEFAULT_THEME,
  },
  // Add other preferences here as needed
};

// Create store instance with schema
const store = new Store({ schema });

module.exports = {
  store,
};
