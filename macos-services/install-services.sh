#!/bin/bash

# Script to install Maraikka macOS Services (Context Menu Integration)
# This will enable "Encrypt with Maraikka" and "Decrypt with Maraikka" in Finder's right-click menu

echo "🔐 Installing Maraikka macOS Services..."

# Get the current directory (where this script is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Services directory in user's Library
SERVICES_DIR="$HOME/Library/Services"

# Create Services directory if it doesn't exist
mkdir -p "$SERVICES_DIR"

echo "📁 Services directory: $SERVICES_DIR"

# Copy the workflow files to the Services directory
echo "📋 Installing Encrypt with Maraikka service..."
cp -R "$SCRIPT_DIR/Encrypt with Maraikka.workflow" "$SERVICES_DIR/"

echo "🔓 Installing Decrypt with Maraikka service..."
cp -R "$SCRIPT_DIR/Decrypt with Maraikka.workflow" "$SERVICES_DIR/"

# Update the script paths in the workflow files to use the current project directory
echo "🔧 Updating script paths..."

# Update encrypt service
sed -i '' "s|/Users/aayusharyan/puzzlers-labs/maraikka-app|$PROJECT_DIR|g" "$SERVICES_DIR/Encrypt with Maraikka.workflow/Contents/document.wflow"

# Update decrypt service
sed -i '' "s|/Users/aayusharyan/puzzlers-labs/maraikka-app|$PROJECT_DIR|g" "$SERVICES_DIR/Decrypt with Maraikka.workflow/Contents/document.wflow"

# Make sure shell scripts are executable
chmod +x "$SCRIPT_DIR/"*.sh

# Refresh the Services menu
echo "🔄 Refreshing Services menu..."
/System/Library/CoreServices/pbs -flush

echo "✅ Installation complete!"
echo ""
echo "📖 How to use:"
echo "1. In Finder, right-click on any file or folder"
echo "2. Look for 'Encrypt with Maraikka' or 'Decrypt with Maraikka' in the Services submenu"
echo "3. If you don't see them immediately, they might be under 'Services' or you may need to:"
echo "   - Go to System Preferences > Keyboard > Shortcuts > Services"
echo "   - Find 'Encrypt with Maraikka' and 'Decrypt with Maraikka' under 'Files and Folders'"
echo "   - Check the boxes to enable them"
echo ""
echo "⚠️  Note: For production use, build the Maraikka app and install it in /Applications/"
echo "   The services will automatically detect whether to use the development or production version."
echo ""
echo "🗑  To uninstall: rm -rf '$SERVICES_DIR/Encrypt with Maraikka.workflow' '$SERVICES_DIR/Decrypt with Maraikka.workflow'" 