# Windows Context Menu Installer
# PowerShell script for Windows registry-based context menu integration
#
# Purpose: Adds "Encrypt with Maraikka" and "Decrypt with Maraikka" options to Windows Explorer
#          right-click context menus for files, directories, and folders
#
# Context: This script provides Windows equivalent functionality to macOS Services integration.
#          Unlike macOS Automator workflows, Windows uses registry modification for context menu
#          integration, requiring administrator privileges for HKLM registry access.
#
# Registry Structure:
# - HKLM:\SOFTWARE\Classes\*\shell: Context menu for files
# - HKLM:\SOFTWARE\Classes\Directory\shell: Context menu for directories
# - HKLM:\SOFTWARE\Classes\Folder\shell: Context menu for folder backgrounds
#
# Security: Requires administrator privileges for system-wide registry modifications
# Compatibility: Windows 10/11, PowerShell 5.1+
#
# Usage: .\install-context-menu.ps1 [-AppPath "path\to\Maraikka.exe"]

param(
    [string]$AppPath = "$env:LOCALAPPDATA\Programs\Maraikka\Maraikka.exe"
)

Write-Host "🔐 Installing Maraikka Context Menu Integration..." -ForegroundColor Green

# Administrative privilege validation
# Context menu registry modifications require HKLM access, which needs admin rights
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "⚠️  This script requires administrator privileges. Restarting as administrator..." -ForegroundColor Yellow
    # Properly escape parameters when relaunching with elevated privileges
    $escapedAppPath = $AppPath -replace '"', '\"'
    Start-Process PowerShell -Verb RunAs -ArgumentList "-File `"$PSCommandPath`" -AppPath `"$escapedAppPath`""
    exit
}

# Application path validation
# Verify executable exists before creating registry entries
if (-not (Test-Path $AppPath)) {
    Write-Host "❌ Maraikka executable not found at: $AppPath" -ForegroundColor Red
    Write-Host "Please ensure Maraikka is installed or provide the correct path using -AppPath parameter" -ForegroundColor Red
    Write-Host "Example: .\install-context-menu.ps1 -AppPath `"C:\Program Files\Maraikka\Maraikka.exe`"" -ForegroundColor Gray
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "📱 Found Maraikka at: $AppPath" -ForegroundColor Cyan

try {
    # Registry path definitions
    # These paths define where Windows Explorer looks for context menu entries
    $fileShellPath = "HKLM:\SOFTWARE\Classes\*\shell"
    $dirShellPath = "HKLM:\SOFTWARE\Classes\Directory\shell"
    $folderShellPath = "HKLM:\SOFTWARE\Classes\Folder\shell"

    Write-Host "📝 Creating registry entries..." -ForegroundColor Cyan

    # File context menu entries
    # Adding encrypt/decrypt options to individual files
    Write-Host "  • Adding 'Encrypt with Maraikka' for files..." -ForegroundColor Gray
    $encryptFilePath = "$fileShellPath\MaraikkaEncrypt"
    New-Item -Path $encryptFilePath -Force | Out-Null
    Set-ItemProperty -Path $encryptFilePath -Name "(Default)" -Value "Encrypt with Maraikka"
    Set-ItemProperty -Path $encryptFilePath -Name "Icon" -Value "`"$AppPath`",0"

    New-Item -Path "$encryptFilePath\command" -Force | Out-Null
    Set-ItemProperty -Path "$encryptFilePath\command" -Name "(Default)" -Value "`"$AppPath`" --encrypt `"%1`""

    Write-Host "  • Adding 'Decrypt with Maraikka' for files..." -ForegroundColor Gray
    $decryptFilePath = "$fileShellPath\MaraikkaDecrypt"
    New-Item -Path $decryptFilePath -Force | Out-Null
    Set-ItemProperty -Path $decryptFilePath -Name "(Default)" -Value "Decrypt with Maraikka"
    Set-ItemProperty -Path $decryptFilePath -Name "Icon" -Value "`"$AppPath`",0"

    New-Item -Path "$decryptFilePath\command" -Force | Out-Null
    Set-ItemProperty -Path "$decryptFilePath\command" -Name "(Default)" -Value "`"$AppPath`" --decrypt `"%1`""

    # Directory context menu entries
    # Adding encrypt/decrypt options when right-clicking on folder icons
    Write-Host "  • Adding 'Encrypt with Maraikka' for directories..." -ForegroundColor Gray
    $encryptDirPath = "$dirShellPath\MaraikkaEncrypt"
    New-Item -Path $encryptDirPath -Force | Out-Null
    Set-ItemProperty -Path $encryptDirPath -Name "(Default)" -Value "Encrypt with Maraikka"
    Set-ItemProperty -Path $encryptDirPath -Name "Icon" -Value "`"$AppPath`",0"

    New-Item -Path "$encryptDirPath\command" -Force | Out-Null
    Set-ItemProperty -Path "$encryptDirPath\command" -Name "(Default)" -Value "`"$AppPath`" --encrypt `"%1`""

    Write-Host "  • Adding 'Decrypt with Maraikka' for directories..." -ForegroundColor Gray
    $decryptDirPath = "$dirShellPath\MaraikkaDecrypt"
    New-Item -Path $decryptDirPath -Force | Out-Null
    Set-ItemProperty -Path $decryptDirPath -Name "(Default)" -Value "Decrypt with Maraikka"
    Set-ItemProperty -Path $decryptDirPath -Name "Icon" -Value "`"$AppPath`",0"

    New-Item -Path "$decryptDirPath\command" -Force | Out-Null
    Set-ItemProperty -Path "$decryptDirPath\command" -Name "(Default)" -Value "`"$AppPath`" --decrypt `"%1`""

    # Folder background context menu entries
    # Adding encrypt/decrypt options when right-clicking in empty folder space
    Write-Host "  • Adding 'Encrypt with Maraikka' for folder backgrounds..." -ForegroundColor Gray
    $encryptFolderPath = "$folderShellPath\MaraikkaEncrypt"
    New-Item -Path $encryptFolderPath -Force | Out-Null
    Set-ItemProperty -Path $encryptFolderPath -Name "(Default)" -Value "Encrypt with Maraikka"
    Set-ItemProperty -Path $encryptFolderPath -Name "Icon" -Value "`"$AppPath`",0"

    New-Item -Path "$encryptFolderPath\command" -Force | Out-Null
    Set-ItemProperty -Path "$encryptFolderPath\command" -Name "(Default)" -Value "`"$AppPath`" --encrypt `"%1`""

    Write-Host "  • Adding 'Decrypt with Maraikka' for folder backgrounds..." -ForegroundColor Gray
    $decryptFolderPath = "$folderShellPath\MaraikkaDecrypt"
    New-Item -Path $decryptFolderPath -Force | Out-Null
    Set-ItemProperty -Path $decryptFolderPath -Name "(Default)" -Value "Decrypt with Maraikka"
    Set-ItemProperty -Path $decryptFolderPath -Name "Icon" -Value "`"$AppPath`",0"

    New-Item -Path "$decryptFolderPath\command" -Force | Out-Null
    Set-ItemProperty -Path "$decryptFolderPath\command" -Name "(Default)" -Value "`"$AppPath`" --decrypt `"%1`""

    # Installation success confirmation
    Write-Host "✅ Context menu integration installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 You can now right-click on files and folders to see:" -ForegroundColor Cyan
    Write-Host "   • Encrypt with Maraikka" -ForegroundColor White
    Write-Host "   • Decrypt with Maraikka" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Note: You may need to restart Windows Explorer to see the changes immediately." -ForegroundColor Yellow
    Write-Host "   You can do this by running: taskkill /f /im explorer.exe && start explorer.exe" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔧 To uninstall: Run the companion uninstall-context-menu.ps1 script" -ForegroundColor Gray

} catch {
    # Comprehensive error handling for registry operations
    Write-Host "❌ Error installing context menu integration: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔍 Details: $($_.Exception.GetType().FullName)" -ForegroundColor Gray
    Write-Host "📍 Location: $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🛠️  Common solutions:" -ForegroundColor Yellow
    Write-Host "   • Ensure you're running as administrator" -ForegroundColor Gray
    Write-Host "   • Check if antivirus is blocking registry modifications" -ForegroundColor Gray
    Write-Host "   • Verify the application path is correct" -ForegroundColor Gray
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")