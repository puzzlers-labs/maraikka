# Internationalization (i18n) Implementation

## Overview

The Maraikka app now supports multiple languages through a custom-built internationalization system using JSON translation files.

## Architecture

### Translation Storage: JSON vs SQLite Analysis

**Why JSON was chosen:**
- ✅ **Lightweight & Fast**: Direct object access, no query overhead
- ✅ **Easy Maintenance**: Human-readable, version control friendly  
- ✅ **Standard Practice**: Used by most web/Electron apps (i18next, react-i18n)
- ✅ **Memory Efficient**: Small translation files load quickly
- ✅ **Synchronous Access**: No async database queries needed
- ✅ **Simple Structure**: Perfect for key-value translation pairs

**SQLite would be overkill** for translation storage in this context.

## File Structure

```
src/
├── locales/
│   ├── en.json          # English translations (default)
│   └── es.json          # Spanish translations
├── renderer/
│   ├── i18n.js          # i18n system implementation
│   ├── renderer.js      # Updated with i18n integration
│   └── index.html       # Updated with data-i18n attributes
```

## Implementation Details

### 1. Core i18n System (`src/renderer/i18n.js`)

**Features:**
- Language file loading and caching
- Nested key support (`sidebar.actions`)
- String interpolation (`"Hello {name}"`)
- Fallback to English for missing translations
- Local storage persistence of language preference
- Event-driven language switching

**Key Methods:**
- `t(key, params)` - Translate a key with optional parameters
- `changeLanguage(langCode)` - Switch to a different language
- `updateUI()` - Update all DOM elements with translation attributes

### 2. HTML Integration

**Translation Attributes:**
- `data-i18n="key"` - Translates textContent
- `data-i18n-placeholder="key"` - Translates placeholder attribute
- `data-i18n-title="key"` - Translates title attribute
- `data-i18n-param-name="value"` - Parameters for interpolation

**Example:**
```html
<button data-i18n="sidebar.selectDirectory" data-i18n-title="sidebar.selectDirectory">
    Select Directory
</button>

<input data-i18n-placeholder="modals.passwordPlaceholder" 
       data-i18n-param-fileName="test.pdf" 
       placeholder="Enter your password">
```

### 3. JavaScript Integration

**Dynamic Translation:**
```javascript
// Simple translation
const message = window.i18n.t('notifications.success');

// With interpolation
const message = window.i18n.t('preview.enterPasswordToPreview', { 
    fileName: 'document.pdf' 
});

// Language switching
await window.i18n.changeLanguage('es');
```

### 4. Language Switcher

Located in **Preferences > General**, the language selector:
- Shows available languages with native names
- Persists selection to localStorage
- Triggers immediate UI updates
- Emits `languageChanged` event for custom handling

## Translation Keys Structure

```json
{
  "app": { ... },
  "sidebar": { ... },
  "fileList": { ... },
  "fileActions": { ... },
  "contextMenu": { ... },
  "modals": { ... },
  "preferences": { ... },
  "license": { ... },
  "about": { ... },
  "hardwareAuth": { ... },
  "preview": { ... },
  "notifications": { ... },
  "fileTypes": { ... },
  "viewModes": { ... },
  "languages": { ... }
}
```

## Currently Supported Languages

1. **English (en)** - Default language
2. **Spanish (es)** - Complete translation
3. **Hindi (hi)** - Complete translation
4. **Japanese (ja)** - Complete translation

## Adding New Languages

1. **Create translation file:**
   ```bash
   cp src/locales/en.json src/locales/[langCode].json
   ```

2. **Translate all values in the new file**

3. **Update i18n.js supportedLanguages:**
   ```javascript
   this.supportedLanguages = {
       'en': 'English',
       'es': 'Español',
       'hi': 'हिन्दी',
       'ja': '日本語',
       'fr': 'Français'  // Add new language
   };
   ```

4. **Add option to language selector in HTML:**
   ```html
   <option value="fr" data-i18n="languages.fr">Français</option>
   ```

## Performance Considerations

- **Lazy Loading**: Only current + fallback languages loaded
- **Memory Efficient**: Small JSON files (~10-20KB each)  
- **Caching**: Languages cached in memory after first load
- **Fast Lookups**: Direct object property access
- **Minimal Bundle**: No external dependencies

## Features

### ✅ Implemented
- [x] JSON-based translation system
- [x] Language persistence (localStorage)
- [x] String interpolation with parameters
- [x] Nested translation keys
- [x] Fallback to English for missing keys
- [x] Dynamic UI updates on language change
- [x] Language switcher in preferences
- [x] Event-driven architecture
- [x] Complete UI translation coverage

### 🚀 Future Enhancements
- [ ] Pluralization rules
- [ ] RTL language support
- [ ] Date/number localization
- [ ] Translation validation tools
- [ ] Hot-reload in development

## Usage Examples

### Basic Translation
```javascript
// Static text
window.i18n.t('sidebar.preferences') 
// Returns: "Preferences" (EN) / "Preferencias" (ES) / "प्राथमिकताएं" (HI) / "環境設定" (JA)
```

### With Parameters
```javascript
// Dynamic content
window.i18n.t('preview.enterPasswordToPreview', { 
    fileName: 'document.pdf' 
});
// Result: "Enter password to preview document.pdf"
```

### HTML Attributes
```html
<!-- Text content -->
<span data-i18n="fileList.encrypted">Encrypted</span>

<!-- Placeholder -->
<input data-i18n-placeholder="modals.passwordPlaceholder">

<!-- With parameters -->
<span data-i18n="notifications.fileEncryptedSuccessfully" 
      data-i18n-param-fileName="test.txt">
</span>
```

## Event System

```javascript
// Listen for language changes
document.addEventListener('languageChanged', (event) => {
    const newLanguage = event.detail.language;
    console.log('Language changed to:', newLanguage);
    
    // Custom handling if needed
    updateCustomComponents();
});
```

## Testing

Use the included test file:
```bash
open test_i18n.html
```

This provides a simple interface to test translation functionality and language switching. 