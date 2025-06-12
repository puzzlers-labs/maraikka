# Windows Implementation Plan for Maraikka

## Overview

This document outlines the comprehensive plan to make Maraikka compatible with Windows systems, including build configuration, platform-specific features, and distribution strategies.

## Current Status: Windows Implementation In Progress

### ✅ Completed
- ✅ Windows build configuration (NSIS, portable, MSIX)
- ✅ Platform-specific UI fixes (titleBar, frame handling)
- ✅ Windows context menu integration (PowerShell scripts)
- ✅ Windows Store distribution setup (MSIX packaging)
- ✅ Windows-specific auto-updater support
- ✅ Multi-platform GitHub Actions workflow
- ✅ Windows setup documentation

### 🔄 In Progress
- 🔄 Windows icon assets (placeholders created)
- 🔄 Code signing certificate setup
- 🔄 Windows Defender SmartScreen submission

### ❌ Remaining Tasks
- ❌ Testing on Windows 10/11
- ❌ Microsoft Store submission
- ❌ Performance optimization
- ❌ User acceptance testing

## Implementation Phases

### Phase 1: Core Windows Compatibility

#### 1.1 Build Configuration
```json
// Add to package.json
"win": {
  "target": [
    {
      "target": "nsis",
      "arch": ["x64", "ia32"]
    },
    {
      "target": "portable",
      "arch": ["x64", "ia32"]
    },
    {
      "target": "zip",
      "arch": ["x64", "ia32"]
    }
  ],
  "icon": "assets/icon.ico",
  "publisherName": "Maraikka Labs",
  "verifyUpdateCodeSignature": false
}
```

#### 1.2 Platform-Specific UI Fixes
- Remove macOS-specific `titleBarStyle: 'hiddenInset'`
- Implement proper Windows frame handling
- Add Windows-specific styling
- Handle Windows-specific keyboard shortcuts

#### 1.3 Cross-Platform File Paths
- Replace macOS-specific path handling
- Use `path.join()` consistently
- Handle Windows drive letters and backslashes

### Phase 2: Windows Context Menu Integration

#### 2.1 Windows Registry Integration
```powershell
# Registry entries for context menu
HKEY_CLASSES_ROOT\*\shell\MaraikkaEncrypt
HKEY_CLASSES_ROOT\*\shell\MaraikkaDecrypt
HKEY_CLASSES_ROOT\Directory\shell\MaraikkaEncrypt
HKEY_CLASSES_ROOT\Directory\shell\MaraikkaDecrypt
```

#### 2.2 PowerShell Scripts
- `windows-context/encrypt-with-maraikka.ps1`
- `windows-context/decrypt-with-maraikka.ps1`
- `windows-context/install-context-menu.ps1`
- `windows-context/uninstall-context-menu.ps1`

#### 2.3 NSIS Installer Integration
- Automatic context menu registration during installation
- Proper cleanup during uninstallation
- Administrator privilege handling

### Phase 3: Windows Store Distribution

#### 3.1 MSIX Packaging
```json
// Add to package.json
"appx": {
  "applicationId": "MaraikkaApp",
  "backgroundColor": "#1a1a1a",
  "displayName": "Maraikka",
  "identityName": "MaraikkaLabs.Maraikka",
  "publisher": "CN=Maraikka Labs",
  "publisherDisplayName": "Maraikka Labs"
}
```

#### 3.2 Windows Store Metadata
- App description and screenshots
- Privacy policy and terms of service
- Age rating and content descriptors
- Store listing optimization

### Phase 4: Auto-Update System Enhancement

#### 4.1 Windows Update Channels
- **Direct Download**: NSIS installer with auto-updater
- **Windows Store**: Microsoft Store update system
- **Portable**: Manual update notification

#### 4.2 Update Manager Enhancement
```javascript
// Platform-specific update handling
if (process.platform === 'win32') {
  // Windows-specific update logic
  if (isWindowsStore()) {
    showWindowsStoreUpdateMessage();
  } else {
    // Use electron-updater for direct downloads
    setupWindowsAutoUpdater();
  }
}
```

### Phase 5: Code Signing and Security

#### 5.1 Windows Code Signing
- Obtain code signing certificate
- Configure electron-builder for Windows signing
- Implement timestamp server for long-term validity

#### 5.2 Windows Defender SmartScreen
- Submit application for reputation building
- Implement proper metadata for trust
- Handle initial "unknown publisher" warnings

## Technical Implementation

### 1. Package.json Updates

```json
{
  "build": {
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        },
        {
          "target": "portable", 
          "arch": ["x64", "ia32"]
        },
        {
          "target": "appx",
          "arch": ["x64", "ia32"]
        }
      ],
      "icon": "assets/icon.ico",
      "publisherName": "Maraikka Labs",
      "requestedExecutionLevel": "asInvoker",
      "verifyUpdateCodeSignature": false,
      "artifactName": "${productName}-${version}-${arch}.${ext}"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "allowElevation": true,
      "installerIcon": "assets/installer.ico",
      "uninstallerIcon": "assets/uninstaller.ico",
      "installerHeaderIcon": "assets/installer-header.ico",
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "Maraikka",
      "include": "scripts/installer.nsh"
    },
    "appx": {
      "applicationId": "MaraikkaApp",
      "backgroundColor": "#1a1a1a",
      "displayName": "Maraikka",
      "identityName": "MaraikkaLabs.Maraikka",
      "publisher": "CN=Maraikka Labs",
      "publisherDisplayName": "Maraikka Labs",
      "languages": ["en-US", "es-ES", "hi-IN", "ja-JP"]
    }
  }
}
```

### 2. Platform Detection and UI Adaptation

```javascript
// src/main.js - Platform-specific window creation
function createWindow() {
  const windowOptions = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    show: false,
    backgroundColor: getThemeColors('dark').backgroundColor
  };

  // Platform-specific window configuration
  if (process.platform === 'darwin') {
    windowOptions.titleBarStyle = 'hiddenInset';
    windowOptions.frame = false;
  } else if (process.platform === 'win32') {
    windowOptions.frame = true;
    windowOptions.autoHideMenuBar = true;
  }

  mainWindow = new BrowserWindow(windowOptions);
}
```

### 3. Windows Context Menu Integration

```powershell
# windows-context/install-context-menu.ps1
param(
    [string]$AppPath = "$env:LOCALAPPDATA\Programs\Maraikka\Maraikka.exe"
)

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires administrator privileges. Restarting as administrator..."
    Start-Process PowerShell -Verb RunAs "-File `"$PSCommandPath`" -AppPath `"$AppPath`""
    exit
}

# Registry paths
$fileShellPath = "HKLM:\SOFTWARE\Classes\*\shell"
$dirShellPath = "HKLM:\SOFTWARE\Classes\Directory\shell"

# Create Encrypt context menu for files
New-Item -Path "$fileShellPath\MaraikkaEncrypt" -Force
Set-ItemProperty -Path "$fileShellPath\MaraikkaEncrypt" -Name "(Default)" -Value "Encrypt with Maraikka"
Set-ItemProperty -Path "$fileShellPath\MaraikkaEncrypt" -Name "Icon" -Value "`"$AppPath`",0"

New-Item -Path "$fileShellPath\MaraikkaEncrypt\command" -Force
Set-ItemProperty -Path "$fileShellPath\MaraikkaEncrypt\command" -Name "(Default)" -Value "`"$AppPath`" --encrypt `"%1`""

# Create Decrypt context menu for files
New-Item -Path "$fileShellPath\MaraikkaDecrypt" -Force
Set-ItemProperty -Path "$fileShellPath\MaraikkaDecrypt" -Name "(Default)" -Value "Decrypt with Maraikka"
Set-ItemProperty -Path "$fileShellPath\MaraikkaDecrypt" -Name "Icon" -Value "`"$AppPath`",0"

New-Item -Path "$fileShellPath\MaraikkaDecrypt\command" -Force
Set-ItemProperty -Path "$fileShellPath\MaraikkaDecrypt\command" -Name "(Default)" -Value "`"$AppPath`" --decrypt `"%1`""

# Repeat for directories...
Write-Host "Context menu integration installed successfully!"
```

### 4. NSIS Installer Script

```nsis
# scripts/installer.nsh
!macro customInstall
  # Install context menu integration
  ExecWait 'powershell.exe -ExecutionPolicy Bypass -File "$INSTDIR\resources\windows-context\install-context-menu.ps1" -AppPath "$INSTDIR\${PRODUCT_FILENAME}.exe"'
!macroend

!macro customUnInstall
  # Remove context menu integration
  ExecWait 'powershell.exe -ExecutionPolicy Bypass -File "$INSTDIR\resources\windows-context\uninstall-context-menu.ps1"'
!macroend
```

### 5. Cross-Platform Update Manager

```javascript
// src/updater.js - Enhanced for Windows
class UpdateManager {
  constructor() {
    this.isAppStore = this.detectAppStore();
    this.isWindowsStore = this.detectWindowsStore();
    this.isDevelopment = process.env.NODE_ENV === 'development';
    // ... existing code
  }

  detectWindowsStore() {
    return process.platform === 'win32' && 
           process.windowsStore === true;
  }

  showWindowsStoreUpdateMessage() {
    const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    
    if (!mainWindow) return;

    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Updates via Microsoft Store',
      message: 'This version of Maraikka is managed by the Microsoft Store',
      detail: 'Updates will be delivered automatically through the Microsoft Store. You can check for updates in the Microsoft Store app.',
      buttons: ['OK', 'Open Microsoft Store'],
      defaultId: 0
    }).then((result) => {
      if (result.response === 1) {
        require('electron').shell.openExternal('ms-windows-store://pdp/?productid=9NBLGGH4NNS1');
      }
    });
  }
}
```

## Distribution Strategy

### Windows Distribution Channels

1. **Direct Download (GitHub Releases)**
   - NSIS installer (.exe)
   - Portable version (.zip)
   - Auto-updater support

2. **Microsoft Store**
   - MSIX package
   - Automatic updates
   - Enhanced security and trust

3. **Package Managers**
   - Chocolatey package
   - Winget package
   - Scoop bucket

### Build Scripts

```json
// package.json scripts
{
  "scripts": {
    "build:win": "electron-builder --win",
    "build:win-store": "electron-builder --win appx",
    "build:win-portable": "electron-builder --win portable",
    "publish:win": "electron-builder --win --publish=always",
    "build:all": "electron-builder --mac --win --linux"
  }
}
```

## Testing Strategy

### Windows Testing Requirements

1. **Operating System Versions**
   - Windows 10 (1903+)
   - Windows 11
   - Windows Server 2019/2022

2. **Architecture Support**
   - x64 (primary)
   - x86 (legacy support)
   - ARM64 (future consideration)

3. **Installation Methods**
   - NSIS installer
   - Portable execution
   - Microsoft Store installation

4. **Feature Testing**
   - File encryption/decryption
   - Context menu integration
   - Auto-updates
   - Hardware authentication (Windows Hello)

## Security Considerations

### Windows-Specific Security

1. **Code Signing**
   - Extended Validation (EV) certificate recommended
   - Timestamp server for long-term validity
   - Proper certificate chain validation

2. **Windows Defender**
   - Submit to Microsoft for analysis
   - Implement proper metadata
   - Monitor reputation scores

3. **User Account Control (UAC)**
   - Minimize elevation requests
   - Proper manifest configuration
   - Clear permission explanations

## Timeline and Milestones

### Phase 1: Core Compatibility (2-3 weeks)
- [ ] Build configuration setup
- [ ] Platform-specific UI fixes
- [ ] Basic Windows testing

### Phase 2: Context Menu Integration (1-2 weeks)
- [ ] PowerShell scripts development
- [ ] Registry integration
- [ ] NSIS installer enhancement

### Phase 3: Store Distribution (2-3 weeks)
- [ ] MSIX packaging
- [ ] Microsoft Store submission
- [ ] Store listing optimization

### Phase 4: Auto-Updates (1-2 weeks)
- [ ] Windows update manager
- [ ] Testing across channels
- [ ] Documentation updates

### Phase 5: Testing and Polish (1-2 weeks)
- [ ] Comprehensive Windows testing
- [ ] Performance optimization
- [ ] User experience refinement

## Success Metrics

- [ ] Successful Windows 10/11 installation
- [ ] Context menu integration working
- [ ] Auto-updates functioning
- [ ] Microsoft Store approval
- [ ] Performance parity with macOS version
- [ ] User feedback positive (>4.0 rating)

---

This implementation plan provides a comprehensive roadmap for making Maraikka fully compatible with Windows systems while maintaining feature parity with the macOS version. 