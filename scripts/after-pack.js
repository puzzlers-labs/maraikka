const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

exports.default = async function(context) {
  console.log('🔧 Running after-pack script...');
  
  // Only run on macOS builds
  if (context.electronPlatformName !== 'darwin') {
    console.log('⏭️  Skipping macOS services installation (not a macOS build)');
    return;
  }

  const appPath = context.appOutDir;
  const appName = context.packager.appInfo.productFilename;
  const builtAppPath = path.join(appPath, `${appName}.app`);
  
  console.log('📱 Built app path:', builtAppPath);
  
  // Path to the macOS services in the built app
  const servicesSourcePath = path.join(builtAppPath, 'Contents', 'Resources', 'macos-services');
  
  if (!fs.existsSync(servicesSourcePath)) {
    console.log('⚠️  macOS services directory not found in built app, skipping installation');
    return;
  }
  
  console.log('🔐 macOS services found, preparing installation script...');
  
  // Create an install script inside the app bundle
  const installScriptPath = path.join(builtAppPath, 'Contents', 'Resources', 'install-macos-services.sh');
  
  const installScript = `#!/bin/bash

# Auto-installer for Maraikka macOS Services
# This script is included in the app bundle and can be run by users

echo "🔐 Installing Maraikka macOS Services..."

# Get the path to this app bundle
APP_PATH="$(cd "$(dirname "\${BASH_SOURCE[0]}")/../.." && pwd)"
SERVICES_SOURCE="\$APP_PATH/Contents/Resources/macos-services"

# Services directory in user's Library
SERVICES_DIR="\$HOME/Library/Services"

# Create Services directory if it doesn't exist
mkdir -p "\$SERVICES_DIR"

echo "📁 Services directory: \$SERVICES_DIR"
echo "📦 App bundle: \$APP_PATH"

# Copy the workflow files to the Services directory
echo "📋 Installing Encrypt with Maraikka service..."
cp -R "\$SERVICES_SOURCE/Encrypt with Maraikka.workflow" "\$SERVICES_DIR/"

echo "🔓 Installing Decrypt with Maraikka service..."
cp -R "\$SERVICES_SOURCE/Decrypt with Maraikka.workflow" "\$SERVICES_DIR/"

# Update the workflow files to use this specific app bundle
echo "🔧 Updating workflow files to use installed app..."

# Create updated AppleScript that calls the installed app
ENCRYPT_SCRIPT="on run {input, parameters}
	
	repeat with currentItem in input
		set itemPath to (POSIX path of currentItem)
		do shell script \"open -a '\$APP_PATH' --args --encrypt \" & quoted form of itemPath
	end repeat
	
	return input
end run"

DECRYPT_SCRIPT="on run {input, parameters}
	
	repeat with currentItem in input
		set itemPath to (POSIX path of currentItem)
		do shell script \"open -a '\$APP_PATH' --args --decrypt \" & quoted form of itemPath
	end repeat
	
	return input
end run"

# Update the workflow files with the correct app path
python3 -c "
import plistlib
import sys

def update_workflow(workflow_path, script_content):
    try:
        with open(workflow_path, 'rb') as f:
            plist = plistlib.load(f)
        
        # Update the AppleScript source in the workflow
        if 'actions' in plist and len(plist['actions']) > 0:
            if 'action' in plist['actions'][0]:
                if 'ActionParameters' in plist['actions'][0]['action']:
                    plist['actions'][0]['action']['ActionParameters']['source'] = script_content
        
        with open(workflow_path, 'wb') as f:
            plistlib.dump(plist, f)
        
        print(f'✅ Updated {workflow_path}')
        return True
    except Exception as e:
        print(f'❌ Failed to update {workflow_path}: {e}')
        return False

# Update encrypt workflow
encrypt_workflow = '\$SERVICES_DIR/Encrypt with Maraikka.workflow/Contents/document.wflow'
decrypt_workflow = '\$SERVICES_DIR/Decrypt with Maraikka.workflow/Contents/document.wflow'

update_workflow(encrypt_workflow, '''$ENCRYPT_SCRIPT''')
update_workflow(decrypt_workflow, '''$DECRYPT_SCRIPT''')
"

# Refresh the Services menu
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

  // Write the install script
  await fs.writeFile(installScriptPath, installScript);
  await fs.chmod(installScriptPath, '755');
  
  console.log('✅ Created macOS services installer script in app bundle');
  
  // Also create a user-friendly installer that can be run from the DMG
  const dmgInstallerPath = path.join(context.outDir, 'Install macOS Services.command');
  const dmgInstaller = `#!/bin/bash

# Find the Maraikka app
MARAIKKA_APP="/Applications/Maraikka.app"

if [ ! -d "\$MARAIKKA_APP" ]; then
    echo "❌ Maraikka app not found in /Applications/"
    echo "Please install Maraikka.app to /Applications/ first"
    exit 1
fi

# Run the installer from the app bundle
"\$MARAIKKA_APP/Contents/Resources/install-macos-services.sh"
`;

  await fs.writeFile(dmgInstallerPath, dmgInstaller);
  await fs.chmod(dmgInstallerPath, '755');
  
  console.log('✅ Created DMG installer script');
  console.log('🎉 After-pack script completed successfully');
}; 