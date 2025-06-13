#!/bin/bash

# Script to encrypt a file with Maraikka
# This script is called by the macOS Service

# Get the file path passed as argument
FILE_PATH="$1"

# Check if file path is provided
if [ -z "$FILE_PATH" ]; then
    echo "Error: No file path provided"
    exit 1
fi

# Check if file exists
if [ ! -e "$FILE_PATH" ]; then
    echo "Error: File does not exist: $FILE_PATH"
    exit 1
fi

# Get the path to the Maraikka app
# This assumes the app is in Applications folder
MARAIKKA_APP="/Applications/Maraikka.app"

# Alternative: Try to find the app using spotlight
if [ ! -d "$MARAIKKA_APP" ]; then
    MARAIKKA_APP=$(mdfind "kMDItemCFBundleIdentifier == 'com.maraikka.app'" | head -n 1)
fi

# If still not found, use the development path
if [ ! -d "$MARAIKKA_APP" ]; then
    # For development - assumes we're running from the project directory
    PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    ELECTRON_PATH="$PROJECT_DIR/node_modules/.bin/electron"
    
    if [ -f "$ELECTRON_PATH" ]; then
        # Development mode
        cd "$PROJECT_DIR"
        "$ELECTRON_PATH" . --encrypt "$FILE_PATH"
        exit $?
    else
        echo "Error: Maraikka app not found"
        exit 1
    fi
fi

# Production mode - call the installed app
open -a "$MARAIKKA_APP" --args --encrypt "$FILE_PATH" 