# Maraikka Build & Installation Instructions

## 🚀 Building the App

### Prerequisites
- Node.js and npm installed
- macOS (for building macOS version)

### Build Commands

```bash
# Install dependencies
npm install

# Build for macOS (creates universal binary)
npm run build-mac

# Build for Windows
npm run build-win

# Build for Linux
npm run build-linux

# Build for all platforms
npm run build
```

### Build Output

After building, you'll find these files in the `dist/` directory:

- **`Maraikka-1.0.0-universal.dmg`** - Main macOS installer
- **`Install macOS Services.command`** - Context menu services installer
- **`mac-universal/Maraikka.app`** - The built application bundle

## 📦 Installing the App

### Step 1: Install the Application

1. **Open the DMG**: Double-click `Maraikka-1.0.0-universal.dmg`
2. **Drag to Applications**: Drag `Maraikka.app` to the `/Applications/` folder
3. **First Launch**: Right-click the app and select "Open" (to bypass Gatekeeper)

### Step 2: Install Context Menu Services (macOS Only)

**Option A - From DMG:**
1. In the mounted DMG, double-click **`Install macOS Services.command`**
2. Enter your password if prompted
3. The services will be automatically installed

**Option B - From Installed App:**
1. Open Terminal
2. Run: `/Applications/Maraikka.app/Contents/Resources/install-macos-services.sh`

**Option C - Manual Installation (Development):**
1. Navigate to the project directory
2. Run: `cd macos-services && ./install-services.sh`

## 🖱️ Using Context Menu Services

After installation, you can:

1. **Right-click** any file or folder in Finder
2. Look for **"Encrypt with Maraikka"** or **"Decrypt with Maraikka"** in the Services menu
3. **Enter your password** in the dialog that appears
4. The file will be encrypted/decrypted in place

### If Services Don't Appear

Sometimes macOS requires manual activation:

1. Open **System Preferences** → **Keyboard** → **Shortcuts**
2. Select **Services** in the sidebar
3. Under **"Files and Folders"**, check:
   - ☑️ Encrypt with Maraikka
   - ☑️ Decrypt with Maraikka

## 🔧 Development

### Running in Development Mode

```bash
# Start the app in development mode
npm start

# Start with developer tools
npm run dev
```

### Development Context Menu

For development, use the manual installer:

```bash
cd macos-services
./install-services.sh
```

This will set up the services to work with the development version of the app.

## 🗑️ Uninstalling

### Remove the App
```bash
rm -rf /Applications/Maraikka.app
```

### Remove Context Menu Services
```bash
rm -rf ~/Library/Services/"Encrypt with Maraikka.workflow"
rm -rf ~/Library/Services/"Decrypt with Maraikka.workflow"
/System/Library/CoreServices/pbs -flush
```

## ⚙️ Build Configuration

The app is configured with:

- **Universal Binary**: Works on both Intel and Apple Silicon Macs
- **Auto-Updater Ready**: Configured for future update mechanisms
- **Code Signing**: Ready for distribution (requires developer certificate)
- **Context Menu Integration**: Automatically included in builds

## 🐛 Troubleshooting

### Build Issues
- Ensure all dependencies are installed: `npm install`
- Try cleaning node_modules: `rm -rf node_modules && npm install`

### Context Menu Issues
- Re-run the services installer
- Check System Preferences → Keyboard → Shortcuts → Services
- Restart Finder: `killall Finder`

### App Won't Launch
- Right-click and select "Open" to bypass Gatekeeper
- Check Console.app for error messages
- Ensure macOS version compatibility (requires macOS 10.12+)

---

**Note**: For production distribution, you'll want to set up proper code signing and notarization. See the electron-builder documentation for details. 