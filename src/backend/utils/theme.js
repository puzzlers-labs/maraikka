/**
 * Get theme-appropriate colors based on app theme
 * @param {string} appTheme - The current app theme ('light' or 'dark')
 * @returns {Object} Theme colors and properties
 */
const { THEMES, DEFAULT_THEME } = require("@constants/theme");
const { store } = require("./preferences-store");

/**
 * Minimal colour palette for core window styling.
 * Richer colours (button states, gradients, etc.) live in the renderer CSS.
 */
const THEME_DEFINITIONS = {
  [THEMES.LIGHT]: {
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
  },
  [THEMES.DARK]: {
    backgroundColor: "#1a1a1a",
    textColor: "#ffffff",
  },
  // Future themes can be added here without touching implementation code
};

/**
 * Resolve theme definition.
 *
 * @param {string|null} [themeName=null] - Optional theme override. When null,
 *        the persisted preference from `preferences-store` is used.
 * @returns {{name: string, backgroundColor: string, textColor: string}} Theme tokens
 */
function getTheme(themeName = null) {
  // 1. Determine the name to use (argument → preference → default)
  const name = themeName || store.get("theme", DEFAULT_THEME);

  // 2. Look up colour tokens; fallback to default theme if unknown
  const def = THEME_DEFINITIONS[name] || THEME_DEFINITIONS[DEFAULT_THEME];

  return {
    name,
    backgroundColor: def.backgroundColor,
    textColor: def.textColor,
  };
}

/**
 * Persist a new theme preference.
 *
 * @param {string} themeName - New theme name (must be part of THEMES)
 */
function setTheme(themeName) {
  if (!Object.values(THEMES).includes(themeName)) {
    throw new Error(
      `Invalid theme: ${themeName}. Must be one of: ${Object.values(THEMES).join(", ")}`,
    );
  }
  store.set("theme", themeName);
}

module.exports = {
  getTheme,
  setTheme,
};
