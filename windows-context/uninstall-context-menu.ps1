# Maraikka Windows Context Menu Uninstaller
# This script removes "Encrypt with Maraikka" and "Decrypt with Maraikka" from the Windows context menu

Write-Host "🗑️  Uninstalling Maraikka Context Menu Integration..." -ForegroundColor Yellow

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "⚠️  This script requires administrator privileges. Restarting as administrator..." -ForegroundColor Yellow
    Start-Process PowerShell -Verb RunAs "-File `"$PSCommandPath`""
    exit
}

try {
    # Registry paths
    $fileShellPath = "HKLM:\SOFTWARE\Classes\*\shell"
    $dirShellPath = "HKLM:\SOFTWARE\Classes\Directory\shell"
    $folderShellPath = "HKLM:\SOFTWARE\Classes\Folder\shell"

    Write-Host "📝 Removing registry entries..." -ForegroundColor Cyan

    # Remove Encrypt context menu for files
    Write-Host "  • Removing 'Encrypt with Maraikka' for files..." -ForegroundColor Gray
    if (Test-Path "$fileShellPath\MaraikkaEncrypt") {
        Remove-Item -Path "$fileShellPath\MaraikkaEncrypt" -Recurse -Force
        Write-Host "    ✓ Removed" -ForegroundColor Green
    } else {
        Write-Host "    ⏭️  Not found" -ForegroundColor Gray
    }

    # Remove Decrypt context menu for files
    Write-Host "  • Removing 'Decrypt with Maraikka' for files..." -ForegroundColor Gray
    if (Test-Path "$fileShellPath\MaraikkaDecrypt") {
        Remove-Item -Path "$fileShellPath\MaraikkaDecrypt" -Recurse -Force
        Write-Host "    ✓ Removed" -ForegroundColor Green
    } else {
        Write-Host "    ⏭️  Not found" -ForegroundColor Gray
    }

    # Remove Encrypt context menu for directories
    Write-Host "  • Removing 'Encrypt with Maraikka' for directories..." -ForegroundColor Gray
    if (Test-Path "$dirShellPath\MaraikkaEncrypt") {
        Remove-Item -Path "$dirShellPath\MaraikkaEncrypt" -Recurse -Force
        Write-Host "    ✓ Removed" -ForegroundColor Green
    } else {
        Write-Host "    ⏭️  Not found" -ForegroundColor Gray
    }

    # Remove Decrypt context menu for directories
    Write-Host "  • Removing 'Decrypt with Maraikka' for directories..." -ForegroundColor Gray
    if (Test-Path "$dirShellPath\MaraikkaDecrypt") {
        Remove-Item -Path "$dirShellPath\MaraikkaDecrypt" -Recurse -Force
        Write-Host "    ✓ Removed" -ForegroundColor Green
    } else {
        Write-Host "    ⏭️  Not found" -ForegroundColor Gray
    }

    # Remove Encrypt context menu for folders
    Write-Host "  • Removing 'Encrypt with Maraikka' for folders..." -ForegroundColor Gray
    if (Test-Path "$folderShellPath\MaraikkaEncrypt") {
        Remove-Item -Path "$folderShellPath\MaraikkaEncrypt" -Recurse -Force
        Write-Host "    ✓ Removed" -ForegroundColor Green
    } else {
        Write-Host "    ⏭️  Not found" -ForegroundColor Gray
    }

    # Remove Decrypt context menu for folders
    Write-Host "  • Removing 'Decrypt with Maraikka' for folders..." -ForegroundColor Gray
    if (Test-Path "$folderShellPath\MaraikkaDecrypt") {
        Remove-Item -Path "$folderShellPath\MaraikkaDecrypt" -Recurse -Force
        Write-Host "    ✓ Removed" -ForegroundColor Green
    } else {
        Write-Host "    ⏭️  Not found" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "✅ Context menu integration uninstalled successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Note: You may need to restart Windows Explorer to see the changes immediately." -ForegroundColor Yellow
    Write-Host "   You can do this by running: taskkill /f /im explorer.exe && start explorer.exe" -ForegroundColor Gray

} catch {
    Write-Host "❌ Error uninstalling context menu integration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 