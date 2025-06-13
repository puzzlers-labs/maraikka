# Maraikka Release Process

This document outlines the complete release process for Maraikka, covering both GitHub releases (direct distribution) and Mac App Store submissions.

## Overview

Maraikka uses a dual distribution strategy:

- **GitHub Releases**: Direct distribution with auto-updater support
- **Mac App Store**: Sandboxed distribution through Apple's App Store

## Distribution Comparison

| Feature | GitHub Release | Mac App Store |
|---------|----------------|---------------|
| **Target Audience** | Power users, developers | General consumers |
| **Update Method** | Auto-updater (electron-updater) | App Store updates |
| **Release Speed** | Immediate | 1-7 days review |
| **Versioning** | Semantic (v1.2.3) | App Store (1.2.3) |
| **Security** | Code signing + notarization | Sandboxed + App Store review |
| **Beta Testing** | Supported | TestFlight |

## Prerequisites

### Development Environment
```bash
# Install dependencies
npm install

# Install global tools
npm install -g electron-builder
```

### Code Signing Setup
1. **Apple Developer Account**: Required for both distributions
2. **Certificates**: 
   - Developer ID Application (for GitHub releases)
   - Mac App Store certificates (for App Store)
3. **Environment Variables**:
   ```bash
   export APPLE_ID="your-apple-id@example.com"
   export APPLE_APP_SPECIFIC_PASSWORD="your-app-specific-password"
   export APPLE_TEAM_ID="your-team-id"
   export CSC_LINK="path-to-certificate.p12"
   export CSC_KEY_PASSWORD="certificate-password"
   ```

## Release Workflow

### 1. Pre-Release Preparation

#### Version Management
```bash
# Check current version
node scripts/version-manager.js current

# Validate configuration
node scripts/version-manager.js validate

# Bump version for GitHub release
node scripts/version-manager.js bump patch github

# Bump version for App Store release
node scripts/version-manager.js bump patch appstore
```

#### Testing Checklist
- [ ] All features working correctly
- [ ] Auto-updater functionality tested
- [ ] Code signing certificates valid
- [ ] All tests passing
- [ ] Documentation updated

### 2. GitHub Release Process

#### Automatic Release (Recommended)
```bash
# Create and push a tag
git tag v1.2.3
git push origin v1.2.3

# GitHub Actions will automatically:
# 1. Build the application
# 2. Sign and notarize
# 3. Create GitHub release
# 4. Upload artifacts
```

#### Manual Release
```bash
# Set version for GitHub distribution
node scripts/version-manager.js set 1.2.3 github

# Build for GitHub release
npm run build:github

# Publish to GitHub
npm run publish:github
```

### 3. Mac App Store Process

#### Build for App Store
```bash
# Set version for App Store distribution
node scripts/version-manager.js set 1.2.3 appstore

# Build for Mac App Store
npm run build:mas
```

#### App Store Connect Submission
1. **Upload to App Store Connect**:
   ```bash
   # Using Transporter app or Xcode
   xcrun altool --upload-app -f "dist/Maraikka-1.2.3.pkg" \
     --type osx \
     --username "$APPLE_ID" \
     --password "$APPLE_APP_SPECIFIC_PASSWORD"
   ```

2. **App Store Connect Configuration**:
   - Set app metadata
   - Upload screenshots
   - Configure pricing
   - Submit for review

### 4. Beta Releases

#### GitHub Beta
```bash
# Create beta release
git tag v1.2.3-beta.1
git push origin v1.2.3-beta.1

# Or use workflow dispatch
# GitHub Actions → Run workflow → Set prerelease: true
```

#### TestFlight Beta
```bash
# Build for TestFlight
npm run build:mas

# Upload to TestFlight
# (Same process as App Store, but select TestFlight in App Store Connect)
```

## Version Management Strategy

### Semantic Versioning
- **Major (X.0.0)**: Breaking changes, major new features
- **Minor (1.X.0)**: New features, backwards compatible
- **Patch (1.2.X)**: Bug fixes, small improvements

### Distribution-Specific Versioning
```javascript
// GitHub Release
{
  "version": "1.2.3",
  "appId": "com.maraikka.app"
}

// Mac App Store
{
  "version": "1.2.3",
  "buildNumber": "202412151430", // Timestamp-based
  "appId": "com.maraikka.app.store"
}
```

### Version Synchronization
```bash
# Sync versions between distributions
node scripts/version-manager.js sync

# This ensures both distributions have the same version number
# but different build configurations
```

## Auto-Update Configuration

### GitHub Releases
- Uses `electron-updater` with GitHub provider
- Automatic update checks every 4 hours
- User can manually check for updates
- Supports delta updates for faster downloads

### App Store Updates
- Managed by macOS App Store
- Users receive notifications through System Preferences
- Updates are automatic or user-initiated

## Troubleshooting

### Common Issues

#### Code Signing Failures
```bash
# Check certificate validity
security find-identity -v -p codesigning

# Verify notarization
xcrun altool --notarization-history 0 \
  --username "$APPLE_ID" \
  --password "$APPLE_APP_SPECIFIC_PASSWORD"
```

#### Build Failures
```bash
# Clean build cache
rm -rf dist/
rm -rf node_modules/
npm install

# Rebuild native modules
npm run postinstall
```

#### Update Server Issues
```bash
# Test update server
curl -H "Accept: application/json" \
  "https://api.github.com/repos/maraikka-labs/maraikka-app/releases/latest"
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=electron-updater npm start

# Check update logs
tail -f ~/Library/Logs/Maraikka/main.log
```

## Release Checklist

### Pre-Release
- [ ] Version bumped correctly
- [ ] Changelog updated
- [ ] Tests passing
- [ ] Code signed and notarized
- [ ] Auto-updater tested

### GitHub Release
- [ ] Tag created and pushed
- [ ] GitHub Actions completed successfully
- [ ] Release artifacts uploaded
- [ ] Release notes published
- [ ] Auto-updater working

### App Store Release
- [ ] App Store build created
- [ ] Uploaded to App Store Connect
- [ ] Metadata configured
- [ ] Screenshots updated
- [ ] Submitted for review
- [ ] Release scheduled

### Post-Release
- [ ] Update documentation
- [ ] Announce release
- [ ] Monitor for issues
- [ ] Update website
- [ ] Social media posts

## Monitoring and Analytics

### Update Analytics
- Track update adoption rates
- Monitor update failures
- Analyze user feedback

### Distribution Metrics
- GitHub download statistics
- App Store analytics
- User retention rates

## Security Considerations

### Code Signing
- All releases must be signed with valid certificates
- Notarization required for macOS Gatekeeper
- Regular certificate renewal

### Update Security
- HTTPS-only update channels
- Signature verification for updates
- Rollback capability for failed updates

## Support and Maintenance

### Long-Term Support
- Security updates for previous major versions
- Bug fixes for critical issues
- Migration guides for breaking changes

### End-of-Life Policy
- 12 months support for major versions
- 6 months notice before EOL
- Clear migration paths

---

For questions or issues with the release process, please contact the development team or create an issue in the repository. 