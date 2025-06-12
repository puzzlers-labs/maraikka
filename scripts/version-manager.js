#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const semver = require('semver');

class VersionManager {
    constructor() {
        this.packageJsonPath = path.join(__dirname, '..', 'package.json');
        this.packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    }

    getCurrentVersion() {
        return this.packageJson.version;
    }

    updateVersion(newVersion, distribution = 'github') {
        if (!semver.valid(newVersion)) {
            throw new Error(`Invalid version: ${newVersion}`);
        }

        const currentVersion = this.getCurrentVersion();
        
        if (!semver.gt(newVersion, currentVersion)) {
            throw new Error(`New version ${newVersion} must be greater than current version ${currentVersion}`);
        }

        // Update package.json
        this.packageJson.version = newVersion;
        
        // Update build configuration based on distribution
        if (distribution === 'appstore') {
            // App Store requires incremental build numbers
            const buildNumber = this.generateBuildNumber();
            this.packageJson.build.mac.buildNumber = buildNumber;
            this.packageJson.build.mas.buildNumber = buildNumber;
            
            // Update bundle identifier for App Store
            this.packageJson.build.appId = 'com.maraikka.app.store';
        } else {
            // GitHub distribution
            this.packageJson.build.appId = 'com.maraikka.app';
            
            // Remove build number for GitHub releases
            if (this.packageJson.build.mac.buildNumber) {
                delete this.packageJson.build.mac.buildNumber;
            }
        }

        // Write updated package.json
        fs.writeFileSync(this.packageJsonPath, JSON.stringify(this.packageJson, null, 2) + '\n');
        
        console.log(`✅ Updated version to ${newVersion} for ${distribution} distribution`);
        
        return {
            version: newVersion,
            distribution: distribution,
            buildNumber: this.packageJson.build.mac?.buildNumber || null
        };
    }

    generateBuildNumber() {
        // Generate build number based on timestamp
        // Format: YYYYMMDDHHMM
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}${month}${day}${hour}${minute}`;
    }

    bumpVersion(type = 'patch', distribution = 'github') {
        const currentVersion = this.getCurrentVersion();
        const newVersion = semver.inc(currentVersion, type);
        
        return this.updateVersion(newVersion, distribution);
    }

    syncVersions() {
        // Sync GitHub and App Store versions
        const currentVersion = this.getCurrentVersion();
        
        console.log('🔄 Syncing versions between distributions...');
        
        // Update for GitHub
        this.updateVersion(currentVersion, 'github');
        console.log(`📦 GitHub version: ${currentVersion}`);
        
        // Update for App Store
        this.updateVersion(currentVersion, 'appstore');
        console.log(`🏪 App Store version: ${currentVersion} (build: ${this.packageJson.build.mac.buildNumber})`);
        
        return {
            version: currentVersion,
            github: { version: currentVersion },
            appstore: { 
                version: currentVersion, 
                buildNumber: this.packageJson.build.mac.buildNumber 
            }
        };
    }

    getVersionInfo() {
        return {
            current: this.getCurrentVersion(),
            next: {
                patch: semver.inc(this.getCurrentVersion(), 'patch'),
                minor: semver.inc(this.getCurrentVersion(), 'minor'),
                major: semver.inc(this.getCurrentVersion(), 'major')
            },
            distribution: process.env.DISTRIBUTION || 'github'
        };
    }

    validateVersionConsistency() {
        const issues = [];
        
        // Check if version follows semantic versioning
        if (!semver.valid(this.getCurrentVersion())) {
            issues.push(`Invalid semantic version: ${this.getCurrentVersion()}`);
        }
        
        // Check if build configuration is consistent
        const appId = this.packageJson.build?.appId;
        if (!appId) {
            issues.push('Missing appId in build configuration');
        }
        
        // Check for required fields
        const requiredFields = ['name', 'version', 'description', 'main'];
        for (const field of requiredFields) {
            if (!this.packageJson[field]) {
                issues.push(`Missing required field: ${field}`);
            }
        }
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
}

// CLI Interface
if (require.main === module) {
    const versionManager = new VersionManager();
    const args = process.argv.slice(2);
    const command = args[0];
    
    try {
        switch (command) {
            case 'current':
                console.log(versionManager.getCurrentVersion());
                break;
                
            case 'info':
                console.log(JSON.stringify(versionManager.getVersionInfo(), null, 2));
                break;
                
            case 'bump':
                const type = args[1] || 'patch';
                const distribution = args[2] || 'github';
                const result = versionManager.bumpVersion(type, distribution);
                console.log(JSON.stringify(result, null, 2));
                break;
                
            case 'set':
                const newVersion = args[1];
                const dist = args[2] || 'github';
                if (!newVersion) {
                    throw new Error('Version is required');
                }
                const setResult = versionManager.updateVersion(newVersion, dist);
                console.log(JSON.stringify(setResult, null, 2));
                break;
                
            case 'sync':
                const syncResult = versionManager.syncVersions();
                console.log(JSON.stringify(syncResult, null, 2));
                break;
                
            case 'validate':
                const validation = versionManager.validateVersionConsistency();
                if (validation.valid) {
                    console.log('✅ Version configuration is valid');
                } else {
                    console.log('❌ Version configuration issues:');
                    validation.issues.forEach(issue => console.log(`  - ${issue}`));
                    process.exit(1);
                }
                break;
                
            default:
                console.log(`
Maraikka Version Manager

Usage:
  node scripts/version-manager.js <command> [options]

Commands:
  current                     Show current version
  info                        Show version information
  bump [patch|minor|major] [github|appstore]  Bump version
  set <version> [github|appstore]             Set specific version
  sync                        Sync versions between distributions
  validate                    Validate version configuration

Examples:
  node scripts/version-manager.js current
  node scripts/version-manager.js bump patch github
  node scripts/version-manager.js set 1.2.3 appstore
  node scripts/version-manager.js sync
                `);
                break;
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

module.exports = VersionManager; 