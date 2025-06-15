#!/bin/bash

# Development macOS Services Installer
#
# This script installs Maraikka's macOS Services integration for development environments.
# It enables "Encrypt with Maraikka" and "Decrypt with Maraikka" context menu options
# in Finder, configured to work with the development build using electron commands.
#
# Purpose:
# - Copies workflow files from project to ~/Library/Services/
# - Updates AppleScript to use development commands (electron . --encrypt/decrypt)
# - Enables testing of Services integration during development
# - Provides contributor-friendly Services installation
#
# Differences from Production:
# - Uses "cd project && electron ." instead of "open -a /Applications/Maraikka.app"
# - Targets development workflow testing vs end-user distribution
# - Requires project setup (npm install, electron available)
# - Manual execution vs automated build integration
#
# Dependencies:
# - Python 3 for plist manipulation
# - Project must be properly set up with dependencies installed
# - macOS Services system for workflow registration
# - Electron executable available in PATH or node_modules
#
# Usage:
# Run from project root or scripts directory: ./scripts/install-macos-services.sh
# Services will appear in Finder context menus after installation
#

echo "🔐 Installing Maraikka macOS Services for Development..."

# System compatibility check
# Ensure this script only runs on macOS systems
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: This script only works on macOS systems"
    echo "   Detected OS: $OSTYPE"
    echo "   macOS Services are only available on macOS (Darwin)"
    exit 1
fi

echo "✅ macOS system detected ($OSTYPE)"

# Path resolution and validation
# Determine script location and derive project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICES_SOURCE_DIR="$PROJECT_DIR/macos-services"

# Validate that required directories exist
if [ ! -d "$SERVICES_SOURCE_DIR" ]; then
    echo "❌ Error: macOS services source directory not found: $SERVICES_SOURCE_DIR"
    echo "   Make sure you're running this script from the project root or scripts directory"
    exit 1
fi

# Check for required workflow files
if [ ! -d "$SERVICES_SOURCE_DIR/Encrypt with Maraikka.workflow" ]; then
    echo "❌ Error: Encrypt workflow not found"
    exit 1
fi

if [ ! -d "$SERVICES_SOURCE_DIR/Decrypt with Maraikka.workflow" ]; then
    echo "❌ Error: Decrypt workflow not found"
    exit 1
fi

# User's macOS Services directory
# This is where macOS looks for user-installed Services
SERVICES_DIR="$HOME/Library/Services"

# Ensure Services directory exists (create if missing)
mkdir -p "$SERVICES_DIR"

echo "📁 Services directory: $SERVICES_DIR"
echo "📦 Project directory: $PROJECT_DIR"

# Copy workflow bundles to Services directory
# Each .workflow is a complete bundle with Info.plist and document.wflow
echo "📋 Installing Encrypt with Maraikka service..."
if ! cp -R "$SERVICES_SOURCE_DIR/Encrypt with Maraikka.workflow" "$SERVICES_DIR/"; then
    echo "❌ Failed to copy Encrypt workflow"
    exit 1
fi

echo "🔓 Installing Decrypt with Maraikka service..."
if ! cp -R "$SERVICES_SOURCE_DIR/Decrypt with Maraikka.workflow" "$SERVICES_DIR/"; then
    echo "❌ Failed to copy Decrypt workflow"
    exit 1
fi

# Update workflows for development environment
# Replace production app paths with development electron commands
echo "🔧 Updating workflows for development use..."

# Development AppleScript templates
# These use "cd project && electron ." instead of "open -a /Applications/Maraikka.app"
DEV_ENCRYPT_SCRIPT="on run {input, parameters}

	repeat with currentItem in input
		set itemPath to (POSIX path of currentItem)
		do shell script \"cd '$PROJECT_DIR' && electron . --encrypt \" & quoted form of itemPath
	end repeat

	return input
end run"

DEV_DECRYPT_SCRIPT="on run {input, parameters}

	repeat with currentItem in input
		set itemPath to (POSIX path of currentItem)
		do shell script \"cd '$PROJECT_DIR' && electron . --decrypt \" & quoted form of itemPath
	end repeat

	return input
end run"

# Python script for plist manipulation
# Updates AppleScript source code in workflow document.wflow files
python3 -c "
import plistlib
import sys
import os

def update_workflow_script(workflow_path, new_script):
    '''
    Updates the AppleScript source code in a workflow document.wflow file

    Args:
        workflow_path: Path to the document.wflow file
        new_script: New AppleScript source code for development environment

    Returns:
        bool: True if update successful, False otherwise
    '''
    try:
        # Validate workflow file exists
        if not os.path.exists(workflow_path):
            print(f'❌ Workflow file not found: {workflow_path}')
            return False

        # Load the workflow plist
        with open(workflow_path, 'rb') as f:
            plist = plistlib.load(f)

        # Update AppleScript source in multiple locations
        # Workflow files store AppleScript in both AMParameterProperties and ActionParameters
        if 'actions' in plist and len(plist['actions']) > 0:
            action = plist['actions'][0]['action']
            updated = False

            # Update tokenizedValue array (used by Automator UI)
            if 'AMParameterProperties' in action and 'source' in action['AMParameterProperties']:
                if 'tokenizedValue' in action['AMParameterProperties']['source']:
                    action['AMParameterProperties']['source']['tokenizedValue'] = [new_script]
                    updated = True

            # Update ActionParameters source (used by runtime)
            if 'ActionParameters' in action and 'source' in action['ActionParameters']:
                action['ActionParameters']['source'] = new_script
                updated = True

            if not updated:
                print(f'⚠️  Warning: Could not find AppleScript source in {workflow_path}')
                return False

        # Write updated plist back to file
        with open(workflow_path, 'wb') as f:
            plistlib.dump(plist, f)

        print(f'✅ Updated {os.path.basename(workflow_path)}')
        return True

    except Exception as e:
        print(f'❌ Error updating {workflow_path}: {e}')
        return False

# Update both workflow files with development scripts
encrypt_workflow_path = '$SERVICES_DIR/Encrypt with Maraikka.workflow/Contents/document.wflow'
decrypt_workflow_path = '$SERVICES_DIR/Decrypt with Maraikka.workflow/Contents/document.wflow'

encrypt_success = update_workflow_script(encrypt_workflow_path, '''$DEV_ENCRYPT_SCRIPT''')
decrypt_success = update_workflow_script(decrypt_workflow_path, '''$DEV_DECRYPT_SCRIPT''')

if encrypt_success and decrypt_success:
    print('✅ Successfully updated both workflows for development use')
else:
    print('❌ Failed to update one or more workflows')
    sys.exit(1)
"

# Check if Python script succeeded
if [ $? -ne 0 ]; then
    echo "❌ Failed to update workflow scripts"
    exit 1
fi

# Maintain script permissions
# Ensure this installer remains executable for future use
chmod +x "$SCRIPT_DIR/install-macos-services.sh"

# Refresh macOS Services menu
# Forces macOS to rescan ~/Library/Services/ and update context menus
echo "🔄 Refreshing Services menu..."
/System/Library/CoreServices/pbs -flush

echo "✅ Development Services installation complete!"
echo ""
echo "📖 How to use:"
echo "1. In Finder, right-click on any file or folder"
echo "2. Look for 'Encrypt with Maraikka' or 'Decrypt with Maraikka' in the Services submenu"
echo "3. If Services don't appear immediately:"
echo "   - Go to System Preferences > Keyboard > Shortcuts > Services"
echo "   - Find 'Encrypt with Maraikka' and 'Decrypt with Maraikka' under 'Files and Folders'"
echo "   - Ensure checkboxes are enabled"
echo ""
echo "🛠️  Development Notes:"
echo "   - Services use 'electron .' commands from project directory"
echo "   - Ensure project dependencies are installed (npm install)"
echo "   - For production builds, use the automated installer instead"
echo ""
echo "🗑  To uninstall:"
echo "   rm -rf '$SERVICES_DIR/Encrypt with Maraikka.workflow'"
echo "   rm -rf '$SERVICES_DIR/Decrypt with Maraikka.workflow'"
echo "   /System/Library/CoreServices/pbs -flush"