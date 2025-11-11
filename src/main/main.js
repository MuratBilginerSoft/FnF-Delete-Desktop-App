const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { DatabaseManager } = require('./Database.js');
const { FileScanner } = require('./FileScanner.js');

// Lazy load autoUpdater to avoid initialization issues
let autoUpdater;

class Main {
  constructor() {
    this.mainWindow = null;
    this.splashWindow = null;
    this.database = null;
    this.fileScanner = null;
  }

  initialize() {
    try {
      // Create splash screen first
      this.createSplashScreen();

      // Initialize database
      this.database = new DatabaseManager();
      this.database.initialize();

      // Initialize file scanner
      this.fileScanner = new FileScanner();

      // Setup auto updater
      this.setupAutoUpdater();

      // Wait a bit, then create main window
      setTimeout(() => {
        this.createWindow();
        this.setupIpcHandlers();
        this.setupAppEvents();
        console.log('FnF Delete application initialized successfully');
      }, 3000); // 3 second delay for splash screen

    } catch (error) {
      console.error('Initialization error:', error);
      app.quit();
    }
  }

  createSplashScreen() {
    this.splashWindow = new BrowserWindow({
      width: 600,
      height: 450,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.splashWindow.loadFile(path.join(__dirname, 'Splash.html'));
    this.splashWindow.center();
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1400,
      minHeight: 900,
      show: false,
      backgroundColor: '#00172D',
      frame: false, // Completely frameless - we'll create custom title bar
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
    });

    // Load the app
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
      this.mainWindow.loadURL('http://localhost:5173');
      // this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
    }

    // Show window when ready and close splash
    this.mainWindow.once('ready-to-show', () => {
      // Close splash screen
      if (this.splashWindow) {
        this.splashWindow.close();
        this.splashWindow = null;
      }
      this.mainWindow.show();
    });

    // Handle window close
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  setupAppEvents() {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    app.on('before-quit', () => {
      if (this.database) {
        this.database.close();
      }
    });
  }

  setupAutoUpdater() {
    // Lazy load autoUpdater after app is ready
    if (!autoUpdater) {
      autoUpdater = require('electron-updater').autoUpdater;
    }

    // Configure autoUpdater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // Check for updates when app is ready (only in production)
    if (app.isPackaged) {
      setTimeout(() => {
        autoUpdater.checkForUpdates().catch(err => {
          console.error('Auto updater check error:', err);
        });
      }, 5000); // Check 5 seconds after startup
    }

    // Update available
    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-available', {
          version: info.version,
          releaseNotes: info.releaseNotes,
          releaseDate: info.releaseDate
        });
      }
    });

    // Update not available
    autoUpdater.on('update-not-available', () => {
      console.log('Update not available');
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-not-available');
      }
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('download-progress', {
          percent: progressObj.percent,
          transferred: progressObj.transferred,
          total: progressObj.total
        });
      }
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-downloaded', {
          version: info.version
        });
      }
    });

    // Error
    autoUpdater.on('error', (error) => {
      console.error('Auto updater error:', error);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-error', {
          message: error.message
        });
      }
    });
  }

  setupIpcHandlers() {
    // ============ WINDOW CONTROL HANDLERS ============

    ipcMain.on('window:minimize', () => {
      if (this.mainWindow) {
        this.mainWindow.minimize();
      }
    });

    ipcMain.on('window:maximize', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMaximized()) {
          // When unmaximizing, set to a fixed size (not resizable beyond this)
          this.mainWindow.unmaximize();
          this.mainWindow.setSize(1400, 900);
          this.mainWindow.center();
        } else {
          this.mainWindow.maximize();
        }
      }
    });

    ipcMain.on('window:close', () => {
      if (this.mainWindow) {
        this.mainWindow.close();
      }
    });

    ipcMain.handle('window:isMaximized', () => {
      return this.mainWindow ? this.mainWindow.isMaximized() : false;
    });

    // ============ PROFILE HANDLERS ============

    ipcMain.handle('profile:create', async (event, { name, avatarColor }) => {
      try {
        return this.database.createProfile(name, avatarColor);
      } catch (error) {
        console.error('Create profile error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('profile:getAll', async () => {
      try {
        return this.database.getAllProfiles();
      } catch (error) {
        console.error('Get profiles error:', error);
        return [];
      }
    });

    ipcMain.handle('profile:get', async (event, profileId) => {
      try {
        return this.database.getProfile(profileId);
      } catch (error) {
        console.error('Get profile error:', error);
        return null;
      }
    });

    ipcMain.handle('profile:updateLastUsed', async (event, profileId) => {
      try {
        this.database.updateProfileLastUsed(profileId);
        return { success: true };
      } catch (error) {
        console.error('Update last used error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('profile:delete', async (event, profileId) => {
      try {
        return this.database.deleteProfile(profileId);
      } catch (error) {
        console.error('Delete profile error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('profile:update', async (event, { id, name, avatarColor }) => {
      try {
        return this.database.updateProfile(id, name, avatarColor);
      } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, message: error.message };
      }
    });

    // ============ FILE SCANNING HANDLERS ============

    ipcMain.handle('files:scan', async (event, { scanPath, extensions, mode, includeSubfolders }) => {
      try {
        const result = await this.fileScanner.scanDirectory(scanPath, extensions, mode, includeSubfolders);
        return result;
      } catch (error) {
        console.error('Scan files error:', error);
        return { success: false, message: error.message, files: [] };
      }
    });

    ipcMain.handle('files:moveToTrash', async (event, { filePaths }) => {
      try {
        const results = [];
        for (const filePath of filePaths) {
          try {
            await shell.trashItem(filePath);
            results.push({ path: filePath, success: true });
          } catch (err) {
            results.push({ path: filePath, success: false, error: err.message });
          }
        }
        return { success: true, results };
      } catch (error) {
        console.error('Move to trash error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('files:selectFolder', async () => {
      try {
        const { dialog } = await import('electron');
        const result = await dialog.showOpenDialog(this.mainWindow, {
          properties: ['openDirectory']
        });

        if (!result.canceled && result.filePaths.length > 0) {
          return { success: true, path: result.filePaths[0] };
        }
        return { success: false };
      } catch (error) {
        console.error('Select folder error:', error);
        return { success: false, message: error.message };
      }
    });

    // ============ DELETION OPERATIONS HANDLERS ============

    ipcMain.handle('operation:create', async (event, { profileId, scanPath, deletionMode, fileExtensions, filesData }) => {
      try {
        // Create operation record
        const operationId = this.database.createDeletionOperation(
          profileId,
          scanPath,
          deletionMode,
          fileExtensions
        );

        // Add deleted files
        let totalSize = 0;
        for (const file of filesData) {
          this.database.addDeletedFile(
            operationId,
            profileId,
            file.path,
            file.name,
            file.extension,
            file.size
          );
          totalSize += file.size;
        }

        // Update operation with totals
        this.database.updateDeletionOperation(
          operationId,
          filesData.length,
          filesData.length,
          totalSize
        );

        return { success: true, operationId };
      } catch (error) {
        console.error('Create operation error:', error);
        return { success: false, message: error.message };
      }
    });

    // ============ STATISTICS HANDLERS ============

    ipcMain.handle('stats:getProfile', async (event, profileId) => {
      try {
        return this.database.getProfileStatistics(profileId);
      } catch (error) {
        console.error('Get statistics error:', error);
        return null;
      }
    });

    ipcMain.handle('stats:getDashboard', async (event, profileId) => {
      try {
        return this.database.getDashboardStats(profileId);
      } catch (error) {
        console.error('Get dashboard stats error:', error);
        return null;
      }
    });

    ipcMain.handle('operation:getDetails', async (event, operationId) => {
      try {
        return this.database.getOperationDetails(operationId);
      } catch (error) {
        console.error('Get operation details error:', error);
        return null;
      }
    });

    // ============ SAVED PATHS HANDLERS ============

    ipcMain.handle('savedPath:create', async (event, { profileId, path, name }) => {
      try {
        return this.database.createSavedPath(profileId, path, name);
      } catch (error) {
        console.error('Create saved path error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('savedPath:getAll', async (event, profileId) => {
      try {
        return this.database.getSavedPaths(profileId);
      } catch (error) {
        console.error('Get saved paths error:', error);
        return [];
      }
    });

    ipcMain.handle('savedPath:delete', async (event, id) => {
      try {
        return this.database.deleteSavedPath(id);
      } catch (error) {
        console.error('Delete saved path error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('savedPath:update', async (event, { id, name }) => {
      try {
        return this.database.updateSavedPath(id, name);
      } catch (error) {
        console.error('Update saved path error:', error);
        return { success: false, message: error.message };
      }
    });

    // ============ PROFILE SETTINGS HANDLERS ============

    ipcMain.handle('profileSettings:get', async (event, profileId) => {
      try {
        return this.database.getProfileSettings(profileId);
      } catch (error) {
        console.error('Get profile settings error:', error);
        return null;
      }
    });

    ipcMain.handle('profileSettings:update', async (event, { profileId, includeSubfolders }) => {
      try {
        return this.database.updateProfileSettings(profileId, includeSubfolders);
      } catch (error) {
        console.error('Update profile settings error:', error);
        return { success: false, message: error.message };
      }
    });

    // ============ AUTO UPDATER HANDLERS ============

    ipcMain.handle('updater:checkForUpdates', async () => {
      try {
        if (!app.isPackaged) {
          return { success: false, message: 'Updates only available in production' };
        }
        if (!autoUpdater) {
          autoUpdater = require('electron-updater').autoUpdater;
        }
        await autoUpdater.checkForUpdates();
        return { success: true };
      } catch (error) {
        console.error('Check for updates error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('updater:downloadUpdate', async () => {
      try {
        if (!autoUpdater) {
          autoUpdater = require('electron-updater').autoUpdater;
        }
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (error) {
        console.error('Download update error:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('updater:installUpdate', () => {
      try {
        if (!autoUpdater) {
          autoUpdater = require('electron-updater').autoUpdater;
        }
        autoUpdater.quitAndInstall(false, true);
        return { success: true };
      } catch (error) {
        console.error('Install update error:', error);
        return { success: false, message: error.message };
      }
    });
  }
}

// Start the application when Electron is ready
app.whenReady().then(() => {
  const mainApp = new Main();
  mainApp.initialize();
});
