/*
Electron Builder After-Pack Hook Script

This script runs automatically after Electron Builder packages the Maraikka app but before final
distribution. It creates macOS Services installation infrastructure that allows users to access
encryption/decryption functionality directly from Finder's context menu.

Purpose:
- Generates user-friendly installation scripts for macOS Services integration
- Dynamically updates workflow files to reference the actual installed app path
- Creates both embedded and standalone installers for flexible deployment
- Ensures seamless integration between Maraikka app and macOS Services system

Dependencies:
- fs-extra: Enhanced file system operations for copying and writing files
- path: Node.js path manipulation utilities
- Electron Builder context: Provides build information and output paths

Build Integration:
This file is automatically executed by Electron Builder's afterpack hook during the build process.
It only runs for macOS builds (darwin platform) and is skipped for other platforms.

Generated Output:
- App bundle installer: [AppName].app/Contents/Resources/install-macos-services.sh
- Standalone installer: Install macOS Services.command (placed in distribution directory)
- Both installers handle dynamic path resolution and workflow file updates
*/

const fs = require("fs-extra");
const path = require("path");

// Main after-pack hook function
// Called automatically by Electron Builder after app packaging is complete
// Parameters: context - Electron Builder context object containing build information
// Returns: Promise<void> - Async function that completes installation script generation
exports.default = async function (context) {
  console.log("🔧 Running after-pack script...");

  // Platform compatibility check
  // Only macOS supports Services integration, other platforms are skipped
  if (context.electronPlatformName !== "darwin") {
    console.log("⏭️  Skipping macOS services installation (not a macOS build)");
    return;
  }

  // Extract build paths and app information from Electron Builder context
  const appPath = context.appOutDir;
  const appName = context.packager.appInfo.productFilename;
  const builtAppPath = path.join(appPath, `${appName}.app`);

  console.log("📱 Built app path:", builtAppPath);

  // Validate that macOS services directory exists in the built app
  // This directory should contain the workflow files copied during build
  const servicesSourcePath = path.join(
    builtAppPath,
    "Contents",
    "Resources",
    "macos-services",
  );

  if (!fs.existsSync(servicesSourcePath)) {
    console.log(
      "⚠️  macOS services directory not found in built app, skipping installation",
    );
    return;
  }

  console.log("🔐 macOS services found, preparing installation script...");

  // Generate embedded installation script path
  // This script will be included inside the app bundle for user access
  const installScriptPath = path.join(
    builtAppPath,
    "Contents",
    "Resources",
    "install-macos-services.sh",
  );

  // Installation script content
  // This bash script handles the complete Services installation process
  const installScript = `#!/bin/bash

# Auto-installer for Maraikka macOS Services
# This script is included in the app bundle and can be run by users

echo "🔐 Installing Maraikka macOS Services..."

# Dynamic path resolution to find the app bundle
# Uses the script's location to determine the app bundle path
APP_PATH="$(cd "$(dirname "\${BASH_SOURCE[0]}")/../.." && pwd)"
SERVICES_SOURCE="\$APP_PATH/Contents/Resources/macos-services"

# User's Services directory where macOS looks for service workflows
SERVICES_DIR="\$HOME/Library/Services"

# Ensure Services directory exists (created if missing)
mkdir -p "\$SERVICES_DIR"

echo "📁 Services directory: \$SERVICES_DIR"
echo "📦 App bundle: \$APP_PATH"

# Copy workflow bundles to user's Services directory
# Each workflow is a complete .workflow bundle with Info.plist and document.wflow
echo "📋 Installing Encrypt with Maraikka service..."
cp -R "\$SERVICES_SOURCE/Encrypt with Maraikka.workflow" "\$SERVICES_DIR/"

echo "🔓 Installing Decrypt with Maraikka service..."
cp -R "\$SERVICES_SOURCE/Decrypt with Maraikka.workflow" "\$SERVICES_DIR/"

# Dynamic workflow path updating
# Replace hardcoded app paths with the actual installed app location
echo "🔧 Updating workflow files to use installed app..."

# AppleScript template for encryption workflow
# Uses dynamic APP_PATH variable instead of hardcoded /Applications/Maraikka.app
ENCRYPT_SCRIPT="on run {input, parameters}

	repeat with currentItem in input
		set itemPath to (POSIX path of currentItem)
		do shell script \"open -a '\$APP_PATH' --args --encrypt \" & quoted form of itemPath
	end repeat

	return input
end run"

# AppleScript template for decryption workflow
# Mirror of encrypt script but with --decrypt argument
DECRYPT_SCRIPT="on run {input, parameters}

	repeat with currentItem in input
		set itemPath to (POSIX path of currentItem)
		do shell script \"open -a '\$APP_PATH' --args --decrypt \" & quoted form of itemPath
	end repeat

	return input
end run"

# Python script for plist manipulation
# Updates the AppleScript source code within the workflow document.wflow files
python3 -c "
import plistlib
import sys

def update_workflow(workflow_path, script_content):
    '''
    Updates the AppleScript source code in a workflow document.wflow file

    Args:
        workflow_path: Path to the document.wflow file
        script_content: New AppleScript source code to inject

    Returns:
        bool: True if update successful, False otherwise
    '''
    try:
        # Load the workflow plist file
        with open(workflow_path, 'rb') as f:
            plist = plistlib.load(f)

        # Navigate to the AppleScript source location in the plist structure
        # Path: actions[0].action.ActionParameters.source
        if 'actions' in plist and len(plist['actions']) > 0:
            if 'action' in plist['actions'][0]:
                if 'ActionParameters' in plist['actions'][0]['action']:
                    plist['actions'][0]['action']['ActionParameters']['source'] = script_content

        # Write the updated plist back to disk
        with open(workflow_path, 'wb') as f:
            plistlib.dump(plist, f)

        print(f'✅ Updated {workflow_path}')
        return True
    except Exception as e:
        print(f'❌ Failed to update {workflow_path}: {e}')
        return False

# Update both workflow files with the dynamically generated scripts
encrypt_workflow = '\$SERVICES_DIR/Encrypt with Maraikka.workflow/Contents/document.wflow'
decrypt_workflow = '\$SERVICES_DIR/Decrypt with Maraikka.workflow/Contents/document.wflow'

update_workflow(encrypt_workflow, '''$ENCRYPT_SCRIPT''')
update_workflow(decrypt_workflow, '''$DECRYPT_SCRIPT''')
"

# Refresh macOS Services menu
# Forces macOS to rescan the Services directory and update context menus
echo "🔄 Refreshing Services menu..."
/System/Library/CoreServices/pbs -flush

echo "✅ Installation complete!"
echo ""
echo "📖 How to use:"
echo "1. In Finder, right-click on any file or folder"
echo "2. Look for 'Encrypt with Maraikka' or 'Decrypt with Maraikka' in the Services submenu"
echo "3. If you don't see them immediately, check System Preferences > Keyboard > Shortcuts > Services"
echo ""
echo "🗑  To uninstall:"
echo "rm -rf '\$SERVICES_DIR/Encrypt with Maraikka.workflow' '\$SERVICES_DIR/Decrypt with Maraikka.workflow'"
`;

  // Write the embedded installation script to the app bundle
  // This script becomes part of the distributed app for user access
  await fs.writeFile(installScriptPath, installScript);
  await fs.chmod(installScriptPath, "755"); // Make script executable

  console.log("✅ Created macOS services installer script in app bundle");

  // Create standalone installer for distribution alongside the app
  // This provides an alternative installation method from the DMG/ZIP
  const dmgInstallerPath = path.join(
    context.outDir,
    "Install macOS Services.command",
  );

  // Standalone installer script content
  // Simpler script that delegates to the embedded installer after validation
  const dmgInstaller = `#!/bin/bash

# Standalone macOS Services installer for Maraikka
# This script can be distributed alongside the app for easy Services installation

# Standard installation path for macOS applications
MARAIKKA_APP="/Applications/Maraikka.app"

# Validate that Maraikka is properly installed before proceeding
if [ ! -d "\$MARAIKKA_APP" ]; then
    echo "❌ Maraikka app not found in /Applications/"
    echo "Please install Maraikka.app to /Applications/ first"
    exit 1
fi

# Delegate to the embedded installer within the app bundle
# This ensures consistent installation logic and path handling
"\$MARAIKKA_APP/Contents/Resources/install-macos-services.sh"
`;

  // Write and make executable the standalone installer
  await fs.writeFile(dmgInstallerPath, dmgInstaller);
  await fs.chmod(dmgInstallerPath, "755");

  console.log("✅ Created DMG installer script");
  console.log("🎉 After-pack script completed successfully");
};
