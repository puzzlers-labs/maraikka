#!/usr/bin/env node

// Version Management Utility
// Node.js script for managing application versions across different distribution channels
//
// Purpose: Provides centralized version management for Electron app builds targeting multiple
//          distribution platforms (GitHub releases, Mac App Store, Microsoft Store) with
//          platform-specific requirements like build numbers and bundle identifiers.
//
// Context: Different distribution channels have varying version requirements:
//          - GitHub: Simple semantic versioning (1.2.3)
//          - Mac App Store: Requires incremental build numbers for updates
//          - Microsoft Store: May require specific versioning schemes
//
// Features:
// - Semantic version validation and incrementation
// - Distribution-specific configuration management
// - Build number generation for App Store submissions
// - Version consistency validation across package.json
// - CLI interface for automated build processes
//
// Dependencies:
// - fs: File system operations for package.json manipulation
// - path: Cross-platform path handling
// - semver: Semantic versioning utilities and validation
//
// Integration:
// - Used by CI/CD workflows for automated version bumping
// - Supports manual version management during development
// - Configures Electron Builder settings based on target distribution
//
// CLI Usage: node scripts/version-manager.js <command> [options]
// Module Usage: const VersionManager = require('./scripts/version-manager.js')

const fs = require("fs");
const path = require("path");
const semver = require("semver");

class VersionManager {
  constructor() {
    this.packageJsonPath = path.join(__dirname, "..", "package.json");
    this.loadPackageJson();
  }

  // Load and parse package.json with error handling
  loadPackageJson() {
    try {
      const content = fs.readFileSync(this.packageJsonPath, "utf8");
      this.packageJson = JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load package.json: ${error.message}`);
    }
  }

  // Save package.json with proper formatting and error handling
  savePackageJson() {
    try {
      const content = JSON.stringify(this.packageJson, null, 2) + "\n";
      fs.writeFileSync(this.packageJsonPath, content);
    } catch (error) {
      throw new Error(`Failed to save package.json: ${error.message}`);
    }
  }

  getCurrentVersion() {
    return this.packageJson.version;
  }

  updateVersion(newVersion, distribution = "github") {
    if (!semver.valid(newVersion)) {
      throw new Error(`Invalid version: ${newVersion}`);
    }

    const currentVersion = this.getCurrentVersion();

    // Allow same version for distribution switching, but require increment for version bumps
    if (
      newVersion !== currentVersion &&
      !semver.gt(newVersion, currentVersion)
    ) {
      throw new Error(
        `New version ${newVersion} must be greater than current version ${currentVersion}`,
      );
    }

    // Update package.json version
    this.packageJson.version = newVersion;

    // Ensure build configuration exists
    if (!this.packageJson.build) {
      this.packageJson.build = {};
    }
    if (!this.packageJson.build.mac) {
      this.packageJson.build.mac = {};
    }

    // Configure distribution-specific settings
    if (distribution === "appstore") {
      // App Store requires incremental build numbers for update validation
      const buildNumber = this.generateBuildNumber();
      this.packageJson.build.mac.buildNumber = buildNumber;

      // Set build number for Mac App Store target if it exists
      if (this.packageJson.build.mas) {
        this.packageJson.build.mas.buildNumber = buildNumber;
      }

      // Use App Store specific bundle identifier
      this.packageJson.build.appId = "com.maraikka.app.store";
    } else {
      // GitHub/direct distribution configuration
      this.packageJson.build.appId = "com.maraikka.app";

      // Remove build number for non-App Store distributions
      if (this.packageJson.build.mac.buildNumber) {
        delete this.packageJson.build.mac.buildNumber;
      }
      if (
        this.packageJson.build.mas &&
        this.packageJson.build.mas.buildNumber
      ) {
        delete this.packageJson.build.mas.buildNumber;
      }
    }

    // Save changes to package.json
    this.savePackageJson();

    console.log(
      `✅ Updated version to ${newVersion} for ${distribution} distribution`,
    );

    return {
      version: newVersion,
      distribution: distribution,
      buildNumber: this.packageJson.build.mac?.buildNumber || null,
    };
  }

  // Generate timestamp-based build number for App Store submissions
  // Format: YYYYMMDDHHMM (ensures incremental build numbers)
  generateBuildNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");

    return `${year}${month}${day}${hour}${minute}`;
  }

  bumpVersion(type = "patch", distribution = "github") {
    const currentVersion = this.getCurrentVersion();
    const newVersion = semver.inc(currentVersion, type);

    if (!newVersion) {
      throw new Error(
        `Failed to increment version: ${currentVersion} with type: ${type}`,
      );
    }

    return this.updateVersion(newVersion, distribution);
  }

  // Configure package.json for specific distribution without changing version
  configureDistribution(distribution = "github") {
    const currentVersion = this.getCurrentVersion();

    console.log(`🔄 Configuring for ${distribution} distribution...`);

    // Use updateVersion with same version to apply distribution settings
    return this.updateVersion(currentVersion, distribution);
  }

  // Prepare configurations for both GitHub and App Store distributions
  prepareDistributions() {
    const currentVersion = this.getCurrentVersion();
    const results = {};

    console.log("🔄 Preparing configurations for all distributions...");

    // Configure for GitHub distribution
    results.github = this.configureDistribution("github");
    console.log(`📦 GitHub configuration ready: ${currentVersion}`);

    // Configure for App Store distribution
    results.appstore = this.configureDistribution("appstore");
    console.log(
      `🏪 App Store configuration ready: ${currentVersion} (build: ${results.appstore.buildNumber})`,
    );

    return {
      version: currentVersion,
      distributions: results,
    };
  }

  getVersionInfo() {
    const current = this.getCurrentVersion();
    return {
      current: current,
      next: {
        patch: semver.inc(current, "patch"),
        minor: semver.inc(current, "minor"),
        major: semver.inc(current, "major"),
      },
      distribution: process.env.DISTRIBUTION || "github",
      buildNumber: this.packageJson.build?.mac?.buildNumber || null,
    };
  }

  validateVersionConsistency() {
    const issues = [];

    // Validate semantic versioning
    if (!semver.valid(this.getCurrentVersion())) {
      issues.push(`Invalid semantic version: ${this.getCurrentVersion()}`);
    }

    // Validate build configuration structure
    const appId = this.packageJson.build?.appId;
    if (!appId) {
      issues.push("Missing appId in build configuration");
    }

    // Validate required package.json fields
    const requiredFields = ["name", "version", "description", "main"];
    for (const field of requiredFields) {
      if (!this.packageJson[field]) {
        issues.push(`Missing required field: ${field}`);
      }
    }

    // Validate version format consistency
    const version = this.getCurrentVersion();
    if (version && !version.match(/^\d+\.\d+\.\d+$/)) {
      issues.push(`Version should follow x.y.z format: ${version}`);
    }

    return {
      valid: issues.length === 0,
      issues: issues,
    };
  }
}

// CLI Interface
// Provides command-line access to version management functionality
if (require.main === module) {
  const versionManager = new VersionManager();
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "current":
        console.log(versionManager.getCurrentVersion());
        break;

      case "info":
        console.log(JSON.stringify(versionManager.getVersionInfo(), null, 2));
        break;

      case "bump":
        const type = args[1] || "patch";
        const distribution = args[2] || "github";
        const result = versionManager.bumpVersion(type, distribution);
        console.log(JSON.stringify(result, null, 2));
        break;

      case "set":
        const newVersion = args[1];
        const dist = args[2] || "github";
        if (!newVersion) {
          throw new Error("Version is required");
        }
        const setResult = versionManager.updateVersion(newVersion, dist);
        console.log(JSON.stringify(setResult, null, 2));
        break;

      case "configure":
        const targetDist = args[1] || "github";
        const configResult = versionManager.configureDistribution(targetDist);
        console.log(JSON.stringify(configResult, null, 2));
        break;

      case "prepare":
        const prepareResult = versionManager.prepareDistributions();
        console.log(JSON.stringify(prepareResult, null, 2));
        break;

      case "validate":
        const validation = versionManager.validateVersionConsistency();
        if (validation.valid) {
          console.log("✅ Version configuration is valid");
        } else {
          console.log("❌ Version configuration issues:");
          validation.issues.forEach((issue) => console.log(`  - ${issue}`));
          process.exit(1);
        }
        break;

      default:
        console.log(`
Version Manager

Usage:
  node scripts/version-manager.js <command> [options]

Commands:
  current                                     Show current version
  info                                        Show version information
  bump [patch|minor|major] [github|appstore]  Bump version
  set <version> [github|appstore]             Set specific version
  configure [github|appstore]                 Configure for distribution
  prepare                                     Prepare all distribution configurations
  validate                                    Validate version configuration

Examples:
  node scripts/version-manager.js current
  node scripts/version-manager.js bump patch github
  node scripts/version-manager.js set 1.2.3 appstore
  node scripts/version-manager.js configure appstore
  node scripts/version-manager.js prepare
                `);
        break;
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = VersionManager;
