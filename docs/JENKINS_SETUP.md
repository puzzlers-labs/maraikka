# Jenkins Setup Guide for Maraikka

This guide explains how to set up Jenkins to build Maraikka across macOS, Windows, and Linux platforms using the provided `Jenkinsfile`.

## 🏗️ Jenkins Infrastructure Requirements

### Multi-Platform Build Agents

You'll need Jenkins agents for each target platform:

1. **macOS Agent** (label: `macos`)
   - macOS 10.15+ (Intel or Apple Silicon)
   - Xcode Command Line Tools
   - Apple Developer account for code signing

2. **Windows Agent** (label: `windows`)
   - Windows 10 (1903+) or Windows 11
   - Visual Studio Build Tools or Visual Studio Community
   - Optional: Code signing certificate

3. **Linux Agent** (label: `linux`)
   - Ubuntu 20.04+ or equivalent
   - Build essentials and development tools

## 🔧 Jenkins Configuration

### Required Plugins

Install these Jenkins plugins:

```bash
# Core plugins
- Pipeline
- Pipeline: Stage View
- Git
- GitHub
- Credentials Binding
- NodeJS

# Notification plugins (optional)
- Slack Notification
- Email Extension
- Build Timestamp

# Artifact management
- Archive Artifacts
- Stash/Unstash
```

### Node.js Tool Configuration

1. **Manage Jenkins** → **Global Tool Configuration**
2. **NodeJS** → **Add NodeJS**
   - Name: `NodeJS-18`
   - Version: `18.x.x` (latest LTS)
   - Global npm packages: `electron-builder`

## 🔐 Credentials Setup

### Required Credentials

Add these credentials in **Manage Jenkins** → **Manage Credentials**:

#### 1. GitHub Token (`github-token`)
```
Type: Secret text
ID: github-token
Description: GitHub Personal Access Token
Secret: [Your GitHub PAT with repo and release permissions]
```

#### 2. Apple Developer Credentials (for macOS builds)
```
Type: Secret text
ID: apple-id
Secret: [Your Apple ID email]

Type: Secret text  
ID: apple-app-specific-password
Secret: [App-specific password from Apple ID]

Type: Secret text
ID: apple-team-id
Secret: [Your Apple Developer Team ID]

Type: Secret file
ID: apple-cert-p12
File: [Your Apple Developer certificate .p12 file]

Type: Secret text
ID: apple-cert-password
Secret: [Password for the .p12 certificate]
```

#### 3. Windows Code Signing (optional)
```
Type: Secret file
ID: windows-cert-p12
File: [Your Windows code signing certificate .p12 file]

Type: Secret text
ID: windows-cert-password
Secret: [Password for the Windows certificate]
```

### GitHub Personal Access Token Setup

1. Go to **GitHub** → **Settings** → **Developer settings** → **Personal access tokens**
2. **Generate new token** with these scopes:
   - `repo` (Full control of private repositories)
   - `write:packages` (Upload packages to GitHub Package Registry)
   - `read:org` (Read org and team membership)

## 🖥️ Agent Setup

### macOS Agent Setup

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18

# Install Xcode Command Line Tools
xcode-select --install

# Install Jenkins agent
# Download agent.jar from your Jenkins master
java -jar agent.jar -jnlpUrl http://your-jenkins:8080/computer/macos-agent/slave-agent.jnlp -secret [secret]
```

### Windows Agent Setup

```powershell
# Install Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js
choco install nodejs-lts -y

# Install Visual Studio Build Tools
choco install visualstudio2022buildtools -y
choco install visualstudio2022-workload-vctools -y

# Install Git
choco install git -y

# Install Jenkins agent
# Download agent.jar from your Jenkins master
java -jar agent.jar -jnlpUrl http://your-jenkins:8080/computer/windows-agent/slave-agent.jnlp -secret [secret]
```

### Linux Agent Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build essentials
sudo apt-get install -y build-essential libnss3-dev libatk-bridge2.0-dev libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2

# Install additional dependencies for AppImage
sudo apt-get install -y fuse

# Install Java for Jenkins agent
sudo apt-get install -y openjdk-11-jre

# Install Jenkins agent
# Download agent.jar from your Jenkins master
java -jar agent.jar -jnlpUrl http://your-jenkins:8080/computer/linux-agent/slave-agent.jnlp -secret [secret]
```

## 📋 Pipeline Job Setup

### Create Pipeline Job

1. **New Item** → **Pipeline**
2. **Pipeline** → **Definition**: `Pipeline script from SCM`
3. **SCM**: `Git`
4. **Repository URL**: `https://github.com/your-org/maraikka-app.git`
5. **Script Path**: `Jenkinsfile`

### Build Parameters

The pipeline supports these parameters:

- **BUILD_PLATFORM**: `all`, `mac`, `windows`, `linux`
- **VERSION**: Custom version (e.g., `v1.2.3`)
- **PRERELEASE**: Mark as pre-release
- **PUBLISH_RELEASE**: Publish to GitHub releases
- **SKIP_TESTS**: Skip running tests

## 🚀 Running Builds

### Manual Build

1. **Build with Parameters**
2. Select desired platform and options
3. **Build**

### Automated Builds

#### Webhook Trigger (GitHub)

1. **Configure** → **Build Triggers** → **GitHub hook trigger for GITScm polling**
2. In GitHub repository:
   - **Settings** → **Webhooks** → **Add webhook**
   - **Payload URL**: `http://your-jenkins:8080/github-webhook/`
   - **Content type**: `application/json`
   - **Events**: `Push`, `Pull requests`

#### Scheduled Builds

```groovy
// Add to Jenkinsfile triggers section
triggers {
    // Build nightly at 2 AM
    cron('0 2 * * *')
    
    // Build on push to main branch
    githubPush()
}
```

## 📊 Build Artifacts

### Artifact Locations

After successful builds, artifacts are available:

- **macOS**: `dist/*.dmg`, `dist/*.zip`, `dist/latest-mac.yml`
- **Windows**: `dist/*.exe`, `dist/*.zip`, `dist/*.appx`, `dist/latest.yml`
- **Linux**: `dist/*.AppImage`, `dist/*.deb`, `dist/*.rpm`, `dist/latest-linux.yml`

### Download Artifacts

1. **Build History** → **[Build Number]**
2. **Build Artifacts** section
3. Click to download individual files

## 🔔 Notifications

### Slack Integration

1. Install **Slack Notification** plugin
2. **Manage Jenkins** → **Configure System** → **Slack**
3. Configure workspace and channel
4. Update `Jenkinsfile` with your channel name

### Email Notifications

1. **Manage Jenkins** → **Configure System** → **Extended E-mail Notification**
2. Configure SMTP settings
3. Set default recipients in `Jenkinsfile`

## 🐛 Troubleshooting

### Common Issues

#### macOS Code Signing Fails
```bash
# Check certificate validity
security find-identity -v -p codesigning

# Import certificate manually
security import certificate.p12 -k ~/Library/Keychains/login.keychain
```

#### Windows Build Fails
```powershell
# Check Node.js and npm versions
node --version
npm --version

# Clear npm cache
npm cache clean --force

# Reinstall node_modules
Remove-Item -Recurse -Force node_modules
npm install
```

#### Linux AppImage Issues
```bash
# Install FUSE if missing
sudo apt-get install fuse

# Check AppImage permissions
chmod +x *.AppImage

# Test AppImage creation
npm run build:linux -- --publish=never
```

### Build Logs

Access detailed logs:
1. **Console Output** for real-time logs
2. **Pipeline Steps** for stage-specific logs
3. **Artifacts** for build outputs

### Performance Optimization

#### Parallel Builds
- Use separate agents for each platform
- Enable parallel execution in pipeline
- Cache `node_modules` between builds

#### Disk Space Management
```bash
# Clean old builds automatically
# Add to Jenkins system configuration
echo "*/30 * * * * find /var/jenkins_home/jobs/*/builds -type d -mtime +7 -exec rm -rf {} \;" | crontab -
```

## 🔒 Security Best Practices

### Credential Management
- Use Jenkins credential store
- Rotate certificates regularly
- Limit credential access by role

### Agent Security
- Run agents with minimal privileges
- Use dedicated build users
- Isolate build environments

### Network Security
- Use HTTPS for Jenkins master
- Restrict agent network access
- Use VPN for remote agents

## 📈 Monitoring and Maintenance

### Build Metrics
- Track build success rates
- Monitor build duration trends
- Set up alerts for failed builds

### Regular Maintenance
- Update Jenkins and plugins monthly
- Rotate certificates before expiration
- Clean up old artifacts and logs

### Backup Strategy
```bash
# Backup Jenkins configuration
tar -czf jenkins-backup-$(date +%Y%m%d).tar.gz /var/jenkins_home

# Backup to remote storage
aws s3 cp jenkins-backup-*.tar.gz s3://your-backup-bucket/
```

## 📚 Additional Resources

- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)
- [Electron Builder Documentation](https://www.electron.build/)
- [Apple Code Signing Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Windows Code Signing Guide](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)

---

This setup provides a robust, scalable build system for Maraikka across all supported platforms with proper security, monitoring, and maintenance practices. 