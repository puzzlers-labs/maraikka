# Maraikka Windows Context Menu Installer
# This script adds "Encrypt with Maraikka" and "Decrypt with Maraikka" to the Windows context menu

param(
    [string]$AppPath = "$env:LOCALAPPDATA\Programs\Maraikka\Maraikka.exe"
)

Write-Host "🔐 Installing Maraikka Context Menu Integration..." -ForegroundColor Green

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "⚠️  This script requires administrator privileges. Restarting as administrator..." -ForegroundColor Yellow
    Start-Process PowerShell -Verb RunAs "-File `"$PSCommandPath`" -AppPath `"$AppPath`""
    exit
}

# Verify Maraikka executable exists
if (-not (Test-Path $AppPath)) {
    Write-Host "❌ Maraikka executable not found at: $AppPath" -ForegroundColor Red
    Write-Host "Please ensure Maraikka is installed or provide the correct path using -AppPath parameter" -ForegroundColor Red
    exit 1
}

Write-Host "📱 Found Maraikka at: $AppPath" -ForegroundColor Cyan

try {
    # Registry paths
    $fileShellPath = "HKLM:\SOFTWARE\Classes\*\shell"
    $dirShellPath = "HKLM:\SOFTWARE\Classes\Directory\shell"
    $folderShellPath = "HKLM:\SOFTWARE\Classes\Folder\shell"

    Write-Host "📝 Creating registry entries..." -ForegroundColor Cyan

    # Create Encrypt context menu for files
    Write-Host "  • Adding 'Encrypt with Maraikka' for files..." -ForegroundColor Gray
    New-Item -Path "$fileShellPath\MaraikkaEncrypt" -Force | Out-Null
    Set-ItemProperty -Path "$fileShellPath\MaraikkaEncrypt" -Name "(Default)" -Value "Encrypt with Maraikka"
    Set-ItemProperty -Path "$fileShellPath\MaraikkaEncrypt" -Name "Icon" -Value "`"$AppPath`",0"

    New-Item -Path "$fileShellPath\MaraikkaEncrypt\command" -Force | Out-Null
    Set-ItemProperty -Path "$fileShellPath\MaraikkaEncrypt\command" -Name "(Default)" -Value "`"$AppPath`" --encrypt `"%1`""

    # Create Decrypt context menu for files
    Write-Host "  • Adding 'Decrypt with Maraikka' for files..." -ForegroundColor Gray
    New-Item -Path "$fileShellPath\MaraikkaDecrypt" -Force | Out-Null
    Set-ItemProperty -Path "$fileShellPath\MaraikkaDecrypt" -Name "(Default)" -Value "Decrypt with Maraikka"
    Set-ItemProperty -Path "$fileShellPath\MaraikkaDecrypt" -Name "Icon" -Value "`"$AppPath`",0"

    New-Item -Path "$fileShellPath\MaraikkaDecrypt\command" -Force | Out-Null
    Set-ItemProperty -Path "$fileShellPath\MaraikkaDecrypt\command" -Name "(Default)" -Value "`"$AppPath`" --decrypt `"%1`""

    # Create Encrypt context menu for directories
    Write-Host "  • Adding 'Encrypt with Maraikka' for directories..." -ForegroundColor Gray
    New-Item -Path "$dirShellPath\MaraikkaEncrypt" -Force | Out-Null
    Set-ItemProperty -Path "$dirShellPath\MaraikkaEncrypt" -Name "(Default)" -Value "Encrypt with Maraikka"
    Set-ItemProperty -Path "$dirShellPath\MaraikkaEncrypt" -Name "Icon" -Value "`"$AppPath`",0"

    New-Item -Path "$dirShellPath\MaraikkaEncrypt\command" -Force | Out-Null
    Set-ItemProperty -Path "$dirShellPath\MaraikkaEncrypt\command" -Name "(Default)" -Value "`"$AppPath`" --encrypt `"%1`""

    # Create Decrypt context menu for directories
    Write-Host "  • Adding 'Decrypt with Maraikka' for directories..." -ForegroundColor Gray
    New-Item -Path "$dirShellPath\MaraikkaDecrypt" -Force | Out-Null
    Set-ItemProperty -Path "$dirShellPath\MaraikkaDecrypt" -Name "(Default)" -Value "Decrypt with Maraikka"
    Set-ItemProperty -Path "$dirShellPath\MaraikkaDecrypt" -Name "Icon" -Value "`"$AppPath`",0"

    New-Item -Path "$dirShellPath\MaraikkaDecrypt\command" -Force | Out-Null
    Set-ItemProperty -Path "$dirShellPath\MaraikkaDecrypt\command" -Name "(Default)" -Value "`"$AppPath`" --decrypt `"%1`""

    # Also add to Folder shell (for folder background right-click)
    Write-Host "  • Adding 'Encrypt with Maraikka' for folders..." -ForegroundColor Gray
    New-Item -Path "$folderShellPath\MaraikkaEncrypt" -Force | Out-Null
    Set-ItemProperty -Path "$folderShellPath\MaraikkaEncrypt" -Name "(Default)" -Value "Encrypt with Maraikka"
    Set-ItemProperty -Path "$folderShellPath\MaraikkaEncrypt" -Name "Icon" -Value "`"$AppPath`",0"

    New-Item -Path "$folderShellPath\MaraikkaEncrypt\command" -Force | Out-Null
    Set-ItemProperty -Path "$folderShellPath\MaraikkaEncrypt\command" -Name "(Default)" -Value "`"$AppPath`" --encrypt `"%1`""

    Write-Host "  • Adding 'Decrypt with Maraikka' for folders..." -ForegroundColor Gray
    New-Item -Path "$folderShellPath\MaraikkaDecrypt" -Force | Out-Null
    Set-ItemProperty -Path "$folderShellPath\MaraikkaDecrypt" -Name "(Default)" -Value "Decrypt with Maraikka"
    Set-ItemProperty -Path "$folderShellPath\MaraikkaDecrypt" -Name "Icon" -Value "`"$AppPath`",0"

    New-Item -Path "$folderShellPath\MaraikkaDecrypt\command" -Force | Out-Null
    Set-ItemProperty -Path "$folderShellPath\MaraikkaDecrypt\command" -Name "(Default)" -Value "`"$AppPath`" --decrypt `"%1`""

    Write-Host "✅ Context menu integration installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 You can now right-click on files and folders to see:" -ForegroundColor Cyan
    Write-Host "   • Encrypt with Maraikka" -ForegroundColor White
    Write-Host "   • Decrypt with Maraikka" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Note: You may need to restart Windows Explorer to see the changes immediately." -ForegroundColor Yellow
    Write-Host "   You can do this by running: taskkill /f /im explorer.exe && start explorer.exe" -ForegroundColor Gray

} catch {
    Write-Host "❌ Error installing context menu integration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 