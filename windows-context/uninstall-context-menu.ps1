# Windows Context Menu Uninstaller
# PowerShell script to remove Windows registry-based context menu integration
#
# Purpose: Safely removes "Encrypt with Maraikka" and "Decrypt with Maraikka" entries
#          from Windows Explorer right-click context menus
#
# Context: This script reverses the registry modifications made by install-context-menu.ps1.
#          It removes context menu entries from files, directories, and folder backgrounds.
#
# Registry Cleanup:
# - Removes HKLM:\SOFTWARE\Classes\*\shell\MaraikkaEncrypt
# - Removes HKLM:\SOFTWARE\Classes\*\shell\MaraikkaDecrypt
# - Removes HKLM:\SOFTWARE\Classes\Directory\shell\MaraikkaEncrypt
# - Removes HKLM:\SOFTWARE\Classes\Directory\shell\MaraikkaDecrypt
# - Removes HKLM:\SOFTWARE\Classes\Folder\shell\MaraikkaEncrypt
# - Removes HKLM:\SOFTWARE\Classes\Folder\shell\MaraikkaDecrypt
#
# Security: Requires administrator privileges for system-wide registry modifications
# Compatibility: Windows 10/11, PowerShell 5.1+
#
# Usage: .\uninstall-context-menu.ps1

Write-Host "🗑️  Uninstalling Maraikka Context Menu Integration..." -ForegroundColor Yellow

# Administrative privilege validation
# Registry cleanup requires HKLM access, which needs admin rights
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "⚠️  This script requires administrator privileges. Restarting as administrator..." -ForegroundColor Yellow
    Start-Process PowerShell -Verb RunAs -ArgumentList "-File `"$PSCommandPath`""
    exit
}

try {
    # Registry path definitions
    # These paths contain the context menu entries to be removed
    $fileShellPath = "HKLM:\SOFTWARE\Classes\*\shell"
    $dirShellPath = "HKLM:\SOFTWARE\Classes\Directory\shell"
    $folderShellPath = "HKLM:\SOFTWARE\Classes\Folder\shell"

    Write-Host "🧹 Removing registry entries..." -ForegroundColor Cyan

    # Remove file context menu entries
    Write-Host "  • Removing context menu entries from files..." -ForegroundColor Gray
    $encryptFilePath = "$fileShellPath\MaraikkaEncrypt"
    $decryptFilePath = "$fileShellPath\MaraikkaDecrypt"

    if (Test-Path $encryptFilePath) {
        Remove-Item -Path $encryptFilePath -Recurse -Force
        Write-Host "    ✓ Removed 'Encrypt with Maraikka' from files" -ForegroundColor Green
    }

    if (Test-Path $decryptFilePath) {
        Remove-Item -Path $decryptFilePath -Recurse -Force
        Write-Host "    ✓ Removed 'Decrypt with Maraikka' from files" -ForegroundColor Green
    }

    # Remove directory context menu entries
    Write-Host "  • Removing context menu entries from directories..." -ForegroundColor Gray
    $encryptDirPath = "$dirShellPath\MaraikkaEncrypt"
    $decryptDirPath = "$dirShellPath\MaraikkaDecrypt"

    if (Test-Path $encryptDirPath) {
        Remove-Item -Path $encryptDirPath -Recurse -Force
        Write-Host "    ✓ Removed 'Encrypt with Maraikka' from directories" -ForegroundColor Green
    }

    if (Test-Path $decryptDirPath) {
        Remove-Item -Path $decryptDirPath -Recurse -Force
        Write-Host "    ✓ Removed 'Decrypt with Maraikka' from directories" -ForegroundColor Green
    }

    # Remove folder background context menu entries
    Write-Host "  • Removing context menu entries from folder backgrounds..." -ForegroundColor Gray
    $encryptFolderPath = "$folderShellPath\MaraikkaEncrypt"
    $decryptFolderPath = "$folderShellPath\MaraikkaDecrypt"

    if (Test-Path $encryptFolderPath) {
        Remove-Item -Path $encryptFolderPath -Recurse -Force
        Write-Host "    ✓ Removed 'Encrypt with Maraikka' from folder backgrounds" -ForegroundColor Green
    }

    if (Test-Path $decryptFolderPath) {
        Remove-Item -Path $decryptFolderPath -Recurse -Force
        Write-Host "    ✓ Removed 'Decrypt with Maraikka' from folder backgrounds" -ForegroundColor Green
    }

    # Uninstallation success confirmation
    Write-Host ""
    Write-Host "✅ Context menu integration uninstalled successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Context menu entries have been removed from:" -ForegroundColor Cyan
    Write-Host "   • Files right-click menu" -ForegroundColor White
    Write-Host "   • Folders right-click menu" -ForegroundColor White
    Write-Host "   • Folder background right-click menu" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Note: You may need to restart Windows Explorer to see the changes immediately." -ForegroundColor Yellow
    Write-Host "   You can do this by running: taskkill /f /im explorer.exe && start explorer.exe" -ForegroundColor Gray

} catch {
    # Comprehensive error handling for registry operations
    Write-Host "❌ Error uninstalling context menu integration: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔍 Details: $($_.Exception.GetType().FullName)" -ForegroundColor Gray
    Write-Host "📍 Location: $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🛠️  Common solutions:" -ForegroundColor Yellow
    Write-Host "   • Ensure you're running as administrator" -ForegroundColor Gray
    Write-Host "   • Check if antivirus is blocking registry modifications" -ForegroundColor Gray
    Write-Host "   • Try running Windows Registry Editor (regedit) manually to remove entries" -ForegroundColor Gray
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")