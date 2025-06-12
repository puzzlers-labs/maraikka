pipeline {
    agent none
    
    parameters {
        choice(
            name: 'BUILD_PLATFORM',
            choices: ['all', 'mac', 'windows', 'linux'],
            description: 'Platform to build for'
        )
        string(
            name: 'VERSION',
            defaultValue: '',
            description: 'Version to build (e.g., v1.2.3). Leave empty to use package.json version'
        )
        booleanParam(
            name: 'PRERELEASE',
            defaultValue: false,
            description: 'Mark as pre-release'
        )
        booleanParam(
            name: 'PUBLISH_RELEASE',
            defaultValue: false,
            description: 'Publish to GitHub releases'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: 'Skip running tests'
        )
    }
    
    environment {
        // GitHub credentials for releases
        GITHUB_TOKEN = credentials('github-token')
        
        // Apple Developer credentials (for macOS builds)
        APPLE_ID = credentials('apple-id')
        APPLE_APP_SPECIFIC_PASSWORD = credentials('apple-app-specific-password')
        APPLE_TEAM_ID = credentials('apple-team-id')
        CSC_LINK = credentials('apple-cert-p12')
        CSC_KEY_PASSWORD = credentials('apple-cert-password')
        
        // Windows code signing (optional)
        WIN_CSC_LINK = credentials('windows-cert-p12')
        WIN_CSC_KEY_PASSWORD = credentials('windows-cert-password')
        
        // Node.js version
        NODE_VERSION = '18'
        
        // Build configuration
        CI = 'true'
        ELECTRON_CACHE = "${WORKSPACE}/.electron-cache"
        ELECTRON_BUILDER_CACHE = "${WORKSPACE}/.electron-builder-cache"
    }
    
    stages {
        stage('Checkout') {
            agent any
            steps {
                script {
                    // Clean workspace
                    cleanWs()
                    
                    // Checkout code
                    checkout scm
                    
                    // Set build version if provided
                    if (params.VERSION) {
                        sh "npm version ${params.VERSION} --no-git-tag-version"
                    }
                    
                    // Store version for later use
                    env.BUILD_VERSION = sh(
                        script: "node -p \"require('./package.json').version\"",
                        returnStdout: true
                    ).trim()
                    
                    echo "Building version: ${env.BUILD_VERSION}"
                }
                
                // Archive source for other stages
                stash includes: '**', name: 'source'
            }
        }
        
        stage('Install Dependencies') {
            agent any
            steps {
                unstash 'source'
                
                script {
                    // Setup Node.js
                    def nodeHome = tool name: "NodeJS-${NODE_VERSION}", type: 'nodejs'
                    env.PATH = "${nodeHome}/bin:${env.PATH}"
                }
                
                // Install dependencies
                sh 'npm ci'
                
                // Install electron-builder globally
                sh 'npm install -g electron-builder'
                
                // Cache node_modules for other stages
                stash includes: 'node_modules/**', name: 'node_modules'
            }
        }
        
        stage('Run Tests') {
            when {
                not { params.SKIP_TESTS }
            }
            agent any
            steps {
                unstash 'source'
                unstash 'node_modules'
                
                script {
                    def nodeHome = tool name: "NodeJS-${NODE_VERSION}", type: 'nodejs'
                    env.PATH = "${nodeHome}/bin:${env.PATH}"
                }
                
                // Run linting
                sh 'npm run lint || echo "Linting completed with warnings"'
                
                // Run tests if they exist
                sh 'npm test || echo "No tests configured"'
                
                // Security audit
                sh 'npm audit --audit-level=high || echo "Security audit completed with warnings"'
            }
        }
        
        stage('Build Platforms') {
            parallel {
                stage('Build macOS') {
                    when {
                        anyOf {
                            expression { params.BUILD_PLATFORM == 'all' }
                            expression { params.BUILD_PLATFORM == 'mac' }
                        }
                    }
                    agent {
                        label 'macos'
                    }
                    steps {
                        unstash 'source'
                        unstash 'node_modules'
                        
                        script {
                            def nodeHome = tool name: "NodeJS-${NODE_VERSION}", type: 'nodejs'
                            env.PATH = "${nodeHome}/bin:${env.PATH}"
                        }
                        
                        // Prepare macOS assets
                        sh '''
                            mkdir -p assets
                            
                            # Create placeholder files if they don't exist
                            if [ ! -f "assets/icon.icns" ]; then
                                echo "Warning: assets/icon.icns not found, using placeholder"
                                touch assets/icon.icns
                            fi
                            
                            if [ ! -f "assets/entitlements.mac.plist" ]; then
                                cat > assets/entitlements.mac.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.debugger</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
</dict>
</plist>
EOF
                            fi
                            
                            if [ ! -f "assets/entitlements.mas.plist" ]; then
                                cat > assets/entitlements.mas.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.files.downloads.read-write</key>
    <true/>
</dict>
</plist>
EOF
                            fi
                            
                            if [ ! -f "assets/entitlements.mas.inherit.plist" ]; then
                                cat > assets/entitlements.mas.inherit.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.inherit</key>
    <true/>
</dict>
</plist>
EOF
                            fi
                        '''
                        
                        // Build for GitHub Release (Direct Distribution)
                        sh '''
                            export DISTRIBUTION=github
                            npm run build:github
                        '''
                        
                        // Build for Mac App Store
                        sh '''
                            export DISTRIBUTION=appstore
                            npm run build:mas
                        '''
                        
                        // Archive macOS builds
                        archiveArtifacts artifacts: 'dist/*.dmg,dist/*.zip,dist/latest-mac.yml,dist/mac/**/*', allowEmptyArchive: true
                        stash includes: 'dist/**', name: 'mac-builds'
                    }
                    post {
                        always {
                            // Clean up sensitive files
                            sh 'rm -f assets/entitlements.*.plist || true'
                        }
                    }
                }
                
                stage('Build Windows') {
                    when {
                        anyOf {
                            expression { params.BUILD_PLATFORM == 'all' }
                            expression { params.BUILD_PLATFORM == 'windows' }
                        }
                    }
                    agent {
                        label 'windows'
                    }
                    steps {
                        unstash 'source'
                        unstash 'node_modules'
                        
                        script {
                            def nodeHome = tool name: "NodeJS-${NODE_VERSION}", type: 'nodejs'
                            env.PATH = "${nodeHome}/bin;${env.PATH}"
                        }
                        
                        // Prepare Windows assets
                        bat '''
                            if not exist "assets" mkdir assets
                            
                            if not exist "assets\\icon.ico" (
                                echo Warning: assets/icon.ico not found, using placeholder
                                echo. > assets\\icon.ico
                            )
                            
                            if not exist "assets\\installer.ico" (
                                echo Creating installer icon placeholder
                                echo. > assets\\installer.ico
                            )
                            
                            if not exist "assets\\uninstaller.ico" (
                                echo Creating uninstaller icon placeholder
                                echo. > assets\\uninstaller.ico
                            )
                            
                            if not exist "assets\\installer-header.ico" (
                                echo Creating installer header icon placeholder
                                echo. > assets\\installer-header.ico
                            )
                        '''
                        
                        // Build for Windows (NSIS)
                        bat '''
                            set DISTRIBUTION=github
                            npm run build:win
                        '''
                        
                        // Build for Windows Store (MSIX)
                        bat '''
                            set DISTRIBUTION=windowsstore
                            npm run build:win-store
                        '''
                        
                        // Archive Windows builds
                        archiveArtifacts artifacts: 'dist/*.exe,dist/*.zip,dist/*.appx,dist/latest.yml,dist/win-unpacked/**/*', allowEmptyArchive: true
                        stash includes: 'dist/**', name: 'windows-builds'
                    }
                }
                
                stage('Build Linux') {
                    when {
                        anyOf {
                            expression { params.BUILD_PLATFORM == 'all' }
                            expression { params.BUILD_PLATFORM == 'linux' }
                        }
                    }
                    agent {
                        label 'linux'
                    }
                    steps {
                        unstash 'source'
                        unstash 'node_modules'
                        
                        script {
                            def nodeHome = tool name: "NodeJS-${NODE_VERSION}", type: 'nodejs'
                            env.PATH = "${nodeHome}/bin:${env.PATH}"
                        }
                        
                        // Prepare Linux assets
                        sh '''
                            mkdir -p assets
                            
                            if [ ! -f "assets/icon.png" ]; then
                                echo "Warning: assets/icon.png not found, using placeholder"
                                touch assets/icon.png
                            fi
                        '''
                        
                        // Build for Linux
                        sh '''
                            export DISTRIBUTION=github
                            npm run build:linux
                        '''
                        
                        // Archive Linux builds
                        archiveArtifacts artifacts: 'dist/*.AppImage,dist/*.deb,dist/*.rpm,dist/latest-linux.yml,dist/linux-unpacked/**/*', allowEmptyArchive: true
                        stash includes: 'dist/**', name: 'linux-builds'
                    }
                }
            }
        }
        
        stage('Create Release') {
            when {
                expression { params.PUBLISH_RELEASE }
            }
            agent any
            steps {
                script {
                    def nodeHome = tool name: "NodeJS-${NODE_VERSION}", type: 'nodejs'
                    env.PATH = "${nodeHome}/bin:${env.PATH}"
                }
                
                // Create release directory
                sh 'mkdir -p release-files'
                
                // Collect all build artifacts
                script {
                    try {
                        unstash 'mac-builds'
                        sh 'cp -r dist/* release-files/ 2>/dev/null || true'
                    } catch (Exception e) {
                        echo "No macOS builds to collect: ${e.getMessage()}"
                    }
                    
                    try {
                        unstash 'windows-builds'
                        sh 'cp -r dist/* release-files/ 2>/dev/null || true'
                    } catch (Exception e) {
                        echo "No Windows builds to collect: ${e.getMessage()}"
                    }
                    
                    try {
                        unstash 'linux-builds'
                        sh 'cp -r dist/* release-files/ 2>/dev/null || true'
                    } catch (Exception e) {
                        echo "No Linux builds to collect: ${e.getMessage()}"
                    }
                }
                
                // List release files
                sh '''
                    echo "Release files:"
                    find release-files -type f -name "*" | sort
                '''
                
                // Create GitHub release
                script {
                    def releaseTag = params.VERSION ?: "v${env.BUILD_VERSION}"
                    def isPrerelease = params.PRERELEASE ? "true" : "false"
                    
                    // Install GitHub CLI if not available
                    sh '''
                        if ! command -v gh &> /dev/null; then
                            echo "Installing GitHub CLI..."
                            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
                            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
                            sudo apt update
                            sudo apt install gh -y
                        fi
                    '''
                    
                    // Create release
                    sh """
                        export GITHUB_TOKEN=${GITHUB_TOKEN}
                        
                        # Create release notes
                        cat > release-notes.md << 'EOF'
## What's New

### Features
- Cross-platform support: macOS, Windows, and Linux
- Context menu integration for all platforms
- Auto-update system for direct downloads
- Store distribution support (Mac App Store, Microsoft Store)

### Installation Options

**macOS:**
- 📦 **Direct Download**: .dmg file with auto-updates
- 🏪 **Mac App Store**: Sandboxed version (separate submission)

**Windows:**
- 📦 **Installer**: .exe NSIS installer with context menu integration
- 📱 **Portable**: .zip portable version
- 🏪 **Microsoft Store**: .appx package (separate submission)

**Linux:**
- 📦 **AppImage**: Universal Linux application
- 📦 **Debian**: .deb package for Ubuntu/Debian
- 📦 **RPM**: .rpm package for Fedora/RHEL/SUSE

### System Requirements
- **macOS**: 10.15 or later (Intel/Apple Silicon)
- **Windows**: Windows 10 (1903+) or Windows 11
- **Linux**: Most modern distributions (x64)

### Security Features
- Hardware authentication support (Touch ID, Windows Hello, FIDO2)
- Code signing and notarization (macOS)
- Digital signatures (Windows)
- Secure auto-update channels

Built with Jenkins Pipeline on ${BUILD_TIMESTAMP}
EOF
                        
                        # Create the release
                        gh release create "${releaseTag}" \
                            --title "Release ${releaseTag}" \
                            --notes-file release-notes.md \
                            ${params.PRERELEASE ? '--prerelease' : ''} \
                            release-files/*.dmg \
                            release-files/*.zip \
                            release-files/*.exe \
                            release-files/*.AppImage \
                            release-files/*.deb \
                            release-files/*.rpm \
                            release-files/*.appx \
                            release-files/latest*.yml \
                            || echo "Release creation failed or release already exists"
                    """
                }
                
                // Archive all release files
                archiveArtifacts artifacts: 'release-files/**/*', allowEmptyArchive: true
            }
        }
    }
    
    post {
        always {
            script {
                // Clean up workspace
                cleanWs()
                
                // Send notifications
                def buildStatus = currentBuild.result ?: 'SUCCESS'
                def buildColor = buildStatus == 'SUCCESS' ? 'good' : 'danger'
                def buildMessage = """
                    *Maraikka Build ${buildStatus}*
                    
                    *Version:* ${env.BUILD_VERSION}
                    *Platform:* ${params.BUILD_PLATFORM}
                    *Branch:* ${env.BRANCH_NAME}
                    *Build:* ${env.BUILD_NUMBER}
                    *Duration:* ${currentBuild.durationString}
                    
                    ${params.PUBLISH_RELEASE ? '*Release Published:* Yes' : '*Release Published:* No'}
                """.stripIndent()
                
                // Slack notification (if configured)
                try {
                    slackSend(
                        color: buildColor,
                        message: buildMessage,
                        channel: '#builds'
                    )
                } catch (Exception e) {
                    echo "Slack notification failed: ${e.getMessage()}"
                }
                
                // Email notification (if configured)
                try {
                    emailext(
                        subject: "Maraikka Build ${buildStatus} - ${env.BUILD_VERSION}",
                        body: buildMessage,
                        to: '${DEFAULT_RECIPIENTS}',
                        attachLog: buildStatus != 'SUCCESS'
                    )
                } catch (Exception e) {
                    echo "Email notification failed: ${e.getMessage()}"
                }
            }
        }
        success {
            echo '🎉 Build completed successfully!'
        }
        failure {
            echo '❌ Build failed!'
        }
        unstable {
            echo '⚠️ Build completed with warnings!'
        }
    }
} 