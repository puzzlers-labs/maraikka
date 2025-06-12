# Maraikka NSIS Installer Custom Script
# This script handles context menu integration during installation and uninstallation

!macro customInstall
  DetailPrint "Installing Maraikka context menu integration..."
  
  # Copy PowerShell scripts to installation directory
  SetOutPath "$INSTDIR\resources\windows-context"
  File "${BUILD_RESOURCES_DIR}\windows-context\install-context-menu.ps1"
  File "${BUILD_RESOURCES_DIR}\windows-context\uninstall-context-menu.ps1"
  
  # Install context menu integration
  DetailPrint "Configuring Windows context menu..."
  ExecWait 'powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "$INSTDIR\resources\windows-context\install-context-menu.ps1" -AppPath "$INSTDIR\${PRODUCT_FILENAME}.exe"' $0
  
  ${If} $0 == 0
    DetailPrint "Context menu integration installed successfully"
  ${Else}
    DetailPrint "Warning: Context menu integration may require manual setup"
  ${EndIf}
!macroend

!macro customUnInstall
  DetailPrint "Removing Maraikka context menu integration..."
  
  # Remove context menu integration
  ExecWait 'powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "$INSTDIR\resources\windows-context\uninstall-context-menu.ps1"' $0
  
  ${If} $0 == 0
    DetailPrint "Context menu integration removed successfully"
  ${Else}
    DetailPrint "Warning: Some context menu entries may need manual removal"
  ${EndIf}
  
  # Clean up PowerShell scripts
  RMDir /r "$INSTDIR\resources\windows-context"
!macroend

# Custom installer page for context menu option
!macro customPageAfterChangeDir
  !insertmacro MUI_PAGE_COMPONENTS
!macroend

# Add context menu as an optional component
!macro customComponentsPage
  SectionGroup "Integration Options" SEC_INTEGRATION
    Section "Windows Context Menu" SEC_CONTEXT_MENU
      SectionIn 1 2 3 RO
      DetailPrint "Context menu integration will be installed"
    SectionEnd
  SectionGroupEnd
!macroend

# Handle component selection
!macro customInit
  # Context menu integration is selected by default
  SectionSetFlags ${SEC_CONTEXT_MENU} ${SF_SELECTED}
!macroend 