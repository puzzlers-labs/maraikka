const { autoUpdater } = require('electron-updater');
const { app, dialog, BrowserWindow } = require('electron');
const semver = require('semver');
const path = require('path');

class UpdateManager {
    constructor() {
        this.isAppStore = process.mas || false;
        this.isWindowsStore = this.detectWindowsStore();
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.updateCheckInterval = null;
        this.updateAvailable = false;
        this.downloadProgress = 0;
        
        this.setupAutoUpdater();
    }

    detectWindowsStore() {
        return process.platform === 'win32' && 
               (process.windowsStore === true || 
                process.env.APPX_PACKAGE_FULL_NAME !== undefined);
    }

    setupAutoUpdater() {
        if (this.isAppStore || this.isWindowsStore || this.isDevelopment) {
            console.log('Auto-updater disabled (App Store, Windows Store, or Development mode)');
            return;
        }

        // Configure auto-updater
        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = true;
        
        // Set update server
        autoUpdater.setFeedURL({
            provider: 'github',
            owner: 'maraikka-labs',
            repo: 'maraikka-app',
            private: false
        });

        // Event listeners
        autoUpdater.on('checking-for-update', () => {
            console.log('Checking for update...');
            this.sendToRenderer('update-checking');
        });

        autoUpdater.on('update-available', (info) => {
            console.log('Update available:', info.version);
            this.updateAvailable = true;
            this.sendToRenderer('update-available', {
                version: info.version,
                releaseNotes: info.releaseNotes,
                releaseDate: info.releaseDate
            });
            this.showUpdateDialog(info);
        });

        autoUpdater.on('update-not-available', (info) => {
            console.log('Update not available');
            this.sendToRenderer('update-not-available');
        });

        autoUpdater.on('error', (err) => {
            console.error('Update error:', err);
            this.sendToRenderer('update-error', err.message);
        });

        autoUpdater.on('download-progress', (progressObj) => {
            this.downloadProgress = progressObj.percent;
            console.log(`Download progress: ${Math.round(progressObj.percent)}%`);
            this.sendToRenderer('update-download-progress', {
                percent: Math.round(progressObj.percent),
                bytesPerSecond: progressObj.bytesPerSecond,
                total: progressObj.total,
                transferred: progressObj.transferred
            });
        });

        autoUpdater.on('update-downloaded', (info) => {
            console.log('Update downloaded');
            this.sendToRenderer('update-downloaded', info);
            this.showInstallDialog(info);
        });
    }

    async checkForUpdates(silent = true) {
        if (this.isAppStore || this.isWindowsStore || this.isDevelopment) {
            if (!silent) {
                if (this.isAppStore) {
                    this.showAppStoreUpdateMessage();
                } else if (this.isWindowsStore) {
                    this.showWindowsStoreUpdateMessage();
                }
            }
            return;
        }

        try {
            await autoUpdater.checkForUpdates();
        } catch (error) {
            console.error('Failed to check for updates:', error);
            if (!silent) {
                dialog.showErrorBox('Update Check Failed', 
                    'Failed to check for updates. Please try again later.');
            }
        }
    }

    async downloadUpdate() {
        if (this.isAppStore || !this.updateAvailable) return;
        
        try {
            await autoUpdater.downloadUpdate();
        } catch (error) {
            console.error('Failed to download update:', error);
            dialog.showErrorBox('Download Failed', 
                'Failed to download update. Please try again later.');
        }
    }

    installUpdate() {
        if (this.isAppStore) return;
        
        autoUpdater.quitAndInstall(false, true);
    }

    showUpdateDialog(info) {
        const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
        
        if (!mainWindow) return;

        const options = {
            type: 'info',
            title: 'Update Available',
            message: `Maraikka ${info.version} is available`,
            detail: `You are currently running version ${app.getVersion()}.\n\nWould you like to download and install the update?`,
            buttons: ['Download Now', 'Download Later', 'Skip This Version'],
            defaultId: 0,
            cancelId: 1
        };

        dialog.showMessageBox(mainWindow, options).then((result) => {
            switch (result.response) {
                case 0: // Download Now
                    this.downloadUpdate();
                    break;
                case 1: // Download Later
                    // User will be reminded on next app launch
                    break;
                case 2: // Skip This Version
                    this.skipVersion(info.version);
                    break;
            }
        });
    }

    showInstallDialog(info) {
        const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
        
        if (!mainWindow) return;

        const options = {
            type: 'info',
            title: 'Update Ready',
            message: `Maraikka ${info.version} has been downloaded`,
            detail: 'The update will be installed when you restart the application.\n\nWould you like to restart now?',
            buttons: ['Restart Now', 'Restart Later'],
            defaultId: 0,
            cancelId: 1
        };

        dialog.showMessageBox(mainWindow, options).then((result) => {
            if (result.response === 0) {
                this.installUpdate();
            }
        });
    }

    showAppStoreUpdateMessage() {
        const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
        
        if (!mainWindow) return;

        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Updates via App Store',
            message: 'This version of Maraikka is managed by the Mac App Store',
            detail: 'Updates will be delivered automatically through the App Store. You can check for updates in the App Store app.',
            buttons: ['OK', 'Open App Store'],
            defaultId: 0
        }).then((result) => {
            if (result.response === 1) {
                require('electron').shell.openExternal('macappstore://showUpdatesPage');
            }
        });
    }

    showWindowsStoreUpdateMessage() {
        const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
        
        if (!mainWindow) return;

        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Updates via Microsoft Store',
            message: 'This version of Maraikka is managed by the Microsoft Store',
            detail: 'Updates will be delivered automatically through the Microsoft Store. You can check for updates in the Microsoft Store app.',
            buttons: ['OK', 'Open Microsoft Store'],
            defaultId: 0
        }).then((result) => {
            if (result.response === 1) {
                require('electron').shell.openExternal('ms-windows-store://downloadsandupdates');
            }
        });
    }

    skipVersion(version) {
        // Store skipped version in user preferences
        const Store = require('electron-store');
        const store = new Store();
        store.set('skippedVersion', version);
    }

    isVersionSkipped(version) {
        const Store = require('electron-store');
        const store = new Store();
        return store.get('skippedVersion') === version;
    }

    startPeriodicCheck() {
        if (this.isAppStore || this.isDevelopment) return;

        // Check for updates every 4 hours
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates(true);
        }, 4 * 60 * 60 * 1000);

        // Initial check after 30 seconds
        setTimeout(() => {
            this.checkForUpdates(true);
        }, 30000);
    }

    stopPeriodicCheck() {
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
            this.updateCheckInterval = null;
        }
    }

    sendToRenderer(channel, data = null) {
        const windows = BrowserWindow.getAllWindows();
        windows.forEach(window => {
            if (window && !window.isDestroyed()) {
                window.webContents.send(channel, data);
            }
        });
    }

    getUpdateInfo() {
        return {
            isAppStore: this.isAppStore,
            isDevelopment: this.isDevelopment,
            currentVersion: app.getVersion(),
            updateAvailable: this.updateAvailable,
            downloadProgress: this.downloadProgress,
            platform: process.platform
        };
    }
}

module.exports = UpdateManager; 