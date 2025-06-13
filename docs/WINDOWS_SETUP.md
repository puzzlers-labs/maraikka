# Maraikka Windows Setup Guide

## 🚀 Installation Options

### Option 1: NSIS Installer (Recommended)
1. **Download** the `.exe` installer from [GitHub Releases](https://github.com/maraikka-labs/maraikka-app/releases)
2. **Run** the installer as Administrator (right-click → "Run as administrator")
3. **Follow** the installation wizard
4. **Context menu integration** will be automatically installed

### Option 2: Portable Version
1. **Download** the `.zip` portable version
2. **Extract** to your preferred location (e.g., `C:\Program Files\Maraikka\`)
3. **Run** `Maraikka.exe` directly
4. **Optional**: Manually install context menu integration (see below)

### Option 3: Microsoft Store (Coming Soon)
- Search for "Maraikka" in the Microsoft Store
- Automatic updates and sandboxed security
- No manual context menu setup required

## 🖱️ Context Menu Integration

### Automatic Installation (NSIS Installer)
The NSIS installer automatically adds context menu options. You'll see:
- **"Encrypt with Maraikka"** - Right-click any file or folder
- **"Decrypt with Maraikka"** - Right-click any file or folder

### Manual Installation (Portable Version)
If using the portable version, install context menu integration manually:

1. **Open PowerShell as Administrator**
2. **Navigate** to the Maraikka directory
3. **Run** the installation script:
   ```powershell
   .\windows-context\install-context-menu.ps1 -AppPath "C:\Path\To\Maraikka.exe"
   ```

### Manual Uninstallation
To remove context menu integration:
```powershell
.\windows-context\uninstall-context-menu.ps1
```

## 🔧 System Requirements

### Minimum Requirements
- **OS**: Windows 10 (version 1903 or later) or Windows 11
- **Architecture**: x64 (64-bit) or x86 (32-bit)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 200 MB free space
- **Network**: Internet connection for updates

### Recommended Requirements
- **OS**: Windows 11 or Windows 10 (latest version)
- **Architecture**: x64 (64-bit)
- **RAM**: 8 GB or more
- **Storage**: 1 GB free space
- **Hardware**: Windows Hello compatible device (for hardware authentication)

## 🛡️ Security Features

### Windows Hello Integration
- **Biometric Authentication**: Use fingerprint or facial recognition
- **PIN Authentication**: Secure PIN-based access
- **Hardware Keys**: Support for FIDO2/WebAuthn devices (YubiKey, etc.)

### Code Signing
- All executables are digitally signed
- Windows Defender SmartScreen compatibility
- Verified publisher identity

### Windows Defender
- Maraikka is submitted to Microsoft for reputation building
- Initial installations may show "Unknown publisher" warning
- This is normal for new applications and will improve over time

## 🔄 Auto-Updates

### Direct Download Version
- **Automatic checking** every 4 hours
- **Background downloads** with user notification
- **User control** over update timing
- **Rollback capability** if needed

### Microsoft Store Version
- **Automatic updates** through Microsoft Store
- **No user intervention** required
- **Managed by Windows Update** system

## 🎯 Usage Instructions

### Basic File Operations
1. **Right-click** any file or folder in Windows Explorer
2. **Select** "Encrypt with Maraikka" or "Decrypt with Maraikka"
3. **Enter** your password or use Windows Hello
4. **Wait** for the operation to complete

### Keyboard Shortcuts
- **Ctrl+O**: Open directory selection dialog
- **Ctrl+,**: Open preferences (when available)
- **Ctrl+Q**: Quit application
- **F11**: Toggle fullscreen mode

### Command Line Usage
```cmd
# Encrypt a file
Maraikka.exe --encrypt "C:\path\to\file.txt"

# Decrypt a file
Maraikka.exe --decrypt "C:\path\to\file.txt.encrypted"

# Open specific directory
Maraikka.exe --directory "C:\path\to\folder"
```

## 🔧 Troubleshooting

### Installation Issues

**Problem**: "Windows protected your PC" message
**Solution**: 
1. Click "More info"
2. Click "Run anyway"
3. This is normal for new applications

**Problem**: Context menu items don't appear
**Solution**:
1. Restart Windows Explorer: `taskkill /f /im explorer.exe && start explorer.exe`
2. Or restart your computer
3. Re-run the context menu installer as Administrator

**Problem**: Installation fails with permission error
**Solution**:
1. Right-click installer and select "Run as administrator"
2. Ensure you have administrative privileges
3. Temporarily disable antivirus if it's blocking installation

### Runtime Issues

**Problem**: Application won't start
**Solution**:
1. Check Windows Event Viewer for error details
2. Ensure all Visual C++ redistributables are installed
3. Try running as Administrator
4. Reinstall the application

**Problem**: Windows Hello not working
**Solution**:
1. Ensure Windows Hello is set up in Windows Settings
2. Check that your device supports Windows Hello
3. Update Windows to the latest version
4. Restart the Windows Hello service

**Problem**: Auto-updates not working
**Solution**:
1. Check internet connection
2. Ensure Windows Firewall isn't blocking Maraikka
3. Run as Administrator to check for updates manually
4. Check proxy settings if in corporate environment

### Performance Issues

**Problem**: Slow encryption/decryption
**Solution**:
1. Close other resource-intensive applications
2. Ensure sufficient free disk space
3. Consider using SSD storage for better performance
4. Check for Windows updates

**Problem**: High memory usage
**Solution**:
1. Restart the application
2. Check for memory leaks in Task Manager
3. Update to the latest version
4. Report the issue on GitHub

## 🔐 Advanced Configuration

### Registry Settings
Advanced users can modify behavior via registry:
```
HKEY_CURRENT_USER\Software\Maraikka\Settings
```

**Available Settings**:
- `AutoUpdateEnabled` (DWORD): Enable/disable auto-updates
- `ContextMenuEnabled` (DWORD): Enable/disable context menu
- `HardwareAuthEnabled` (DWORD): Enable/disable Windows Hello
- `UpdateCheckInterval` (DWORD): Update check interval in hours

### Group Policy (Enterprise)
For enterprise deployments, administrators can:
1. Disable auto-updates via Group Policy
2. Pre-configure settings via registry deployment
3. Control context menu installation
4. Manage hardware authentication policies

### Firewall Configuration
If using corporate firewall, allow these connections:
- **GitHub API**: `api.github.com` (port 443)
- **GitHub Releases**: `github.com` (port 443)
- **Update Server**: `releases.github.com` (port 443)

## 📞 Support

### Getting Help
1. **Documentation**: Check the [main README](../README.md)
2. **GitHub Issues**: Report bugs or request features
3. **Discussions**: Community support and questions
4. **Email**: Contact support for enterprise inquiries

### Reporting Issues
When reporting Windows-specific issues, include:
- Windows version and build number
- Installation method (NSIS/Portable/Store)
- Error messages or screenshots
- Steps to reproduce the problem
- System specifications

### Contributing
- **Bug Reports**: Use GitHub Issues
- **Feature Requests**: Use GitHub Discussions
- **Code Contributions**: Submit Pull Requests
- **Documentation**: Help improve this guide

---

## 📋 Quick Reference

### File Locations
- **Installation**: `C:\Program Files\Maraikka\` or `C:\Users\{User}\AppData\Local\Programs\Maraikka\`
- **User Data**: `C:\Users\{User}\AppData\Roaming\Maraikka\`
- **Logs**: `C:\Users\{User}\AppData\Roaming\Maraikka\logs\`
- **Context Scripts**: `{InstallDir}\resources\windows-context\`

### Important Commands
```powershell
# Check if Maraikka is running
Get-Process -Name "Maraikka" -ErrorAction SilentlyContinue

# Restart Windows Explorer (for context menu)
taskkill /f /im explorer.exe; start explorer.exe

# Check Windows version
winver

# View application logs
Get-EventLog -LogName Application -Source "Maraikka" -Newest 10
```

### Registry Locations
- **Context Menu**: `HKLM\SOFTWARE\Classes\*\shell\Maraikka*`
- **User Settings**: `HKCU\Software\Maraikka`
- **Uninstall Info**: `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Maraikka` 