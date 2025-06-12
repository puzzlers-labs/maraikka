# Images Directory

This directory contains all images, screenshots, and media files used in the Maraikka documentation.

## Required Images

### Screenshots
- `main-interface.png` - Main Maraikka interface showing sidebar and file list
- `password-modal.png` - Password entry modal with strength meter
- `password-strength.png` - Password strength meter examples
- `image-editor.png` - Image editor interface with tools
- `encryption-progress.png` - Progress bar during encryption

### GIFs/Videos
- `single-file-encrypt.gif` - Animation showing single file encryption process
- `directory-encrypt.gif` - Animation showing directory encryption process
- `encrypt-file.gif` - General file encryption workflow

### Feature Screenshots
- `file-preview.png` - File preview panel in action
- `text-editor.png` - Text editor interface
- `preferences.png` - Settings and preferences window
- `hardware-auth.png` - Hardware authentication setup

## Image Guidelines

### Format Requirements
- **Screenshots**: PNG format for crisp UI elements
- **Animations**: GIF format, optimized for web
- **Photos**: JPG format for photographs

### Size Guidelines
- **Max width**: 1200px for full-width images
- **Thumbnails**: 400px width for inline images
- **File size**: Keep under 500KB per image

### Naming Convention
- Use kebab-case: `main-interface.png`
- Be descriptive: `password-strength-meter.png`
- Include version if needed: `ui-v2-main.png`

## Creating Screenshots

### macOS
```bash
# Full screen
Cmd + Shift + 3

# Selected area
Cmd + Shift + 4

# Window
Cmd + Shift + 4, then Space, then click window
```

### Windows
```bash
# Full screen
PrtScn

# Active window
Alt + PrtScn

# Selected area
Windows + Shift + S
```

### Linux
```bash
# Using GNOME Screenshot
gnome-screenshot

# Using scrot
scrot -s filename.png
```

## Optimization

### Before Adding Images
1. **Crop appropriately** - remove unnecessary UI elements
2. **Resize for web** - max 1200px width
3. **Optimize file size** - use tools like ImageOptim, TinyPNG
4. **Add alt text** in documentation

### Tools for Optimization
- **ImageOptim** (macOS)
- **TinyPNG** (web-based)
- **GIMP** (cross-platform)
- **Squoosh** (web-based)

## Missing Images

Currently, all images referenced in the documentation are placeholders. To complete the documentation:

1. Take screenshots of Maraikka in action
2. Create animated GIFs of key workflows
3. Optimize all images for web
4. Replace placeholder references with actual files

## Contributing Images

When contributing images:
1. Follow the naming convention
2. Optimize for web delivery
3. Ensure images show current UI
4. Include both light and dark theme versions if applicable
5. Update documentation references accordingly 