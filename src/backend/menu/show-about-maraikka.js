// About Menu Handler
// Delegates the "Help → About" menu action to the About-window module.
//
// Purpose:
// - Keep menu logic slim by deferring UI construction to `@backend/windows/about-maraikka-window`.
//
// Dependencies:
// - @backend/windows/about-maraikka-window: Provides create/get helpers.
//
// Usage Examples:
// ```javascript
// const handleShowAbout = require("@backend/menu/show-about");
// MenuItem({ label: "About Maraikka", click: handleShowAbout });
// ```

const {
  createAboutMaraikkaWindow,
  getMaraikkaWindow,
} = require("@backend/windows/about-maraikka-window");

/**
 * Shows the About window, creating it if necessary.
 * Exported for use as an Electron menu click handler.
 */
function handleShowAboutMaraikka() {
  const existingWindow = getMaraikkaWindow();
  if (existingWindow && !existingWindow.isDestroyed()) {
    existingWindow.focus();
  } else {
    createAboutMaraikkaWindow();
  }
}

module.exports = { handleShowAboutMaraikka };
