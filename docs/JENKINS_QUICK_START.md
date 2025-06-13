# Jenkins Quick Start Guide

## 🚀 Quick Setup Checklist

### Prerequisites
- [ ] Jenkins server running
- [ ] Multi-platform agents configured (macOS, Windows, Linux)
- [ ] Required plugins installed
- [ ] Credentials configured

### 5-Minute Setup

1. **Create Pipeline Job**
   ```
   New Item → Pipeline → "Maraikka-Build"
   Pipeline from SCM → Git → Repository URL
   Script Path: Jenkinsfile
   ```

2. **Configure Credentials**
   ```
   Manage Jenkins → Manage Credentials
   Add: github-token, apple-id, apple-cert-p12, etc.
   ```

3. **Run First Build**
   ```
   Build with Parameters
   Platform: mac (for testing)
   Version: (leave empty)
   Build Now
   ```

## 🎯 Common Build Scenarios

### Development Build (Single Platform)
```
BUILD_PLATFORM: mac
VERSION: (empty - uses package.json)
PRERELEASE: false
PUBLISH_RELEASE: false
SKIP_TESTS: false
```

### Release Build (All Platforms)
```
BUILD_PLATFORM: all
VERSION: v1.2.3
PRERELEASE: false
PUBLISH_RELEASE: true
SKIP_TESTS: false
```

### Beta Release
```
BUILD_PLATFORM: all
VERSION: v1.2.3-beta.1
PRERELEASE: true
PUBLISH_RELEASE: true
SKIP_TESTS: false
```

### Quick Test Build
```
BUILD_PLATFORM: linux
VERSION: (empty)
PRERELEASE: false
PUBLISH_RELEASE: false
SKIP_TESTS: true
```

## 📋 Build Commands Reference

### Manual Commands (if needed)

```bash
# macOS builds
npm run build:github    # GitHub release
npm run build:mas       # Mac App Store

# Windows builds  
npm run build:win       # NSIS installer
npm run build:win-store # Microsoft Store
npm run build:win-portable # Portable version

# Linux builds
npm run build:linux     # All Linux formats

# Multi-platform
npm run build:all       # All platforms
```

## 🔍 Monitoring Builds

### Build Status
- **Blue**: Success ✅
- **Red**: Failed ❌  
- **Yellow**: Unstable ⚠️
- **Gray**: Aborted/Not built

### Key Metrics
- **Duration**: Normal builds ~10-30 minutes
- **Artifacts**: Check for platform-specific files
- **Console Output**: Real-time build logs

## 🐛 Quick Troubleshooting

### Build Fails Immediately
```bash
# Check agent connectivity
Jenkins → Manage Nodes → [Agent] → Log

# Verify credentials
Manage Jenkins → Manage Credentials → Test Connection
```

### macOS Build Issues
```bash
# Common fixes
- Check Apple Developer certificates
- Verify Xcode Command Line Tools
- Ensure proper entitlements
```

### Windows Build Issues
```bash
# Common fixes
- Verify Visual Studio Build Tools
- Check Node.js version
- Clear npm cache: npm cache clean --force
```

### Linux Build Issues
```bash
# Common fixes
- Install missing dependencies
- Check FUSE for AppImage
- Verify build-essential package
```

## 📊 Artifact Downloads

### After Successful Build
1. Go to build page
2. **Build Artifacts** section
3. Download platform-specific files:
   - **macOS**: `.dmg`, `.zip`
   - **Windows**: `.exe`, `.zip`, `.appx`
   - **Linux**: `.AppImage`, `.deb`, `.rpm`

### Auto-Update Files
- `latest-mac.yml` (macOS)
- `latest.yml` (Windows)  
- `latest-linux.yml` (Linux)

## 🔔 Notifications Setup

### Slack (Optional)
```groovy
// In Jenkinsfile post section
slackSend(
    color: 'good',
    message: 'Build completed!',
    channel: '#builds'
)
```

### Email (Optional)
```groovy
// In Jenkinsfile post section
emailext(
    subject: 'Build Status',
    body: 'Build completed',
    to: 'team@company.com'
)
```

## 🔄 Automated Triggers

### GitHub Webhook
```
Repository Settings → Webhooks
URL: http://jenkins:8080/github-webhook/
Events: Push, Pull Request
```

### Scheduled Builds
```groovy
// Add to Jenkinsfile
triggers {
    cron('0 2 * * *') // Nightly at 2 AM
}
```

## 📈 Performance Tips

### Speed Up Builds
- Use dedicated agents per platform
- Cache `node_modules` between builds
- Skip tests for development builds
- Use parallel execution

### Resource Management
- Monitor disk space on agents
- Clean old builds regularly
- Use build retention policies

## 🔒 Security Notes

### Credential Security
- Never log sensitive credentials
- Use Jenkins credential store
- Rotate certificates regularly

### Agent Security
- Run with minimal privileges
- Isolate build environments
- Monitor agent access

## 📞 Getting Help

### Build Logs
1. **Console Output**: Real-time logs
2. **Pipeline Steps**: Stage-specific details
3. **Build Artifacts**: Generated files

### Common Log Locations
- Jenkins: `/var/jenkins_home/jobs/[job]/builds/[number]/log`
- Agent logs: Available in Jenkins UI
- Build artifacts: Downloadable from UI

### Support Channels
- Check build console output first
- Review agent connectivity
- Verify credential configuration
- Test individual build commands locally

---

**Quick Tip**: Start with single-platform builds (macOS or Linux) to verify setup before attempting multi-platform builds. 