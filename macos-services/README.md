# macOS Context Menu Integration

This directory contains the macOS Services integration for Maraikka, which adds **"Encrypt with Maraikka"** and **"Decrypt with Maraikka"** options to the Finder right-click context menu.

## 🚀 Quick Installation

Run the installation script:

```bash
cd macos-services
./install-services.sh
```

## 📁 What's Included

### Shell Scripts
- **`encrypt-with-maraikka.sh`** - Calls Maraikka with `--encrypt` argument
- **`decrypt-with-maraikka.sh`** - Calls Maraikka with `--decrypt` argument

### Automator Workflows
- **`Encrypt with Maraikka.workflow/`** - macOS Service for encryption
- **`Decrypt with Maraikka.workflow/`** - macOS Service for decryption

### Installation
- **`install-services.sh`** - Automated installation script

## 🔧 How It Works

1. **Context Menu Click**: User right-clicks on a file/folder in Finder
2. **Service Selection**: User selects "Encrypt with Maraikka" or "Decrypt with Maraikka"
3. **Shell Script Execution**: Automator calls the appropriate shell script
4. **Electron Launch**: Shell script launches Maraikka with command-line arguments
5. **Password Dialog**: Maraikka shows a compact password input dialog
6. **File Processing**: File is encrypted/decrypted in place

## 📖 Usage Instructions

### After Installation

1. **In Finder**: Right-click on any file or folder
2. **Services Menu**: Look for the options in the context menu or under "Services" submenu
3. **Password Entry**: A small dialog will appear asking for your encryption password
4. **Processing**: The file will be encrypted/decrypted in place

### If Services Don't Appear

Sometimes macOS needs manual activation:

1. Open **System Preferences** > **Keyboard** > **Shortcuts**
2. Select **Services** in the left sidebar
3. Under **"Files and Folders"** section, find:
   - ☑️ Encrypt with Maraikka
   - ☑️ Decrypt with Maraikka
4. Check the boxes to enable them

## 🛠 Technical Details

### Smart App Detection

The shell scripts automatically detect whether to use:
- **Development Mode**: `electron . --encrypt/--decrypt` (when in project directory)
- **Production Mode**: `/Applications/Maraikka.app` (when app is installed)

### Command Line Arguments

Maraikka now supports these command-line arguments:
- `--encrypt "/path/to/file"` - Opens password dialog for encryption
- `--decrypt "/path/to/file"` - Opens password dialog for decryption

### Security

- **Isolated Dialog**: Context menu actions open a separate, minimal window
- **No Storage**: Passwords are never stored, only used for immediate operation
- **Process Isolation**: Each context menu action runs independently

## 🗑 Uninstalling

To remove the services:

```bash
rm -rf ~/Library/Services/"Encrypt with Maraikka.workflow"
rm -rf ~/Library/Services/"Decrypt with Maraikka.workflow"
/System/Library/CoreServices/pbs -flush
```

## 🐛 Troubleshooting

### Services Not Appearing
- Run `./install-services.sh` again
- Check System Preferences > Keyboard > Shortcuts > Services
- Restart Finder: `killall Finder`

### Permission Errors
- Ensure shell scripts are executable: `chmod +x *.sh`
- Check that project directory is accessible

### Development vs Production
- For development: Keep project in accessible location
- For production: Build and install Maraikka.app in `/Applications/`

## 🔄 Updating

When updating Maraikka or moving the project:

1. Run `./install-services.sh` again
2. This will update the paths in the service files

## 📋 File Structure

```
macos-services/
├── README.md                           # This documentation
├── install-services.sh                 # Installation script
├── encrypt-with-maraikka.sh           # Encryption shell script
├── decrypt-with-maraikka.sh           # Decryption shell script
├── Encrypt with Maraikka.workflow/    # Automator service
│   └── Contents/
│       ├── Info.plist                 # Service metadata
│       └── document.wflow             # Workflow definition
└── Decrypt with Maraikka.workflow/    # Automator service
    └── Contents/
        ├── Info.plist                 # Service metadata
        └── document.wflow             # Workflow definition
```

---

**Note**: This integration provides seamless encryption/decryption directly from Finder, making Maraikka as convenient as built-in macOS features! 