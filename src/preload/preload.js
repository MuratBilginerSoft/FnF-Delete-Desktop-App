const { contextBridge, ipcRenderer } = require('electron');
const packageJson = require('../../package.json');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => packageJson.version,

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Profile operations
  createProfile: (name, avatarColor) =>
    ipcRenderer.invoke('profile:create', { name, avatarColor }),

  getAllProfiles: () =>
    ipcRenderer.invoke('profile:getAll'),

  getProfile: (profileId) =>
    ipcRenderer.invoke('profile:get', profileId),

  updateProfileLastUsed: (profileId) =>
    ipcRenderer.invoke('profile:updateLastUsed', profileId),

  deleteProfile: (profileId) =>
    ipcRenderer.invoke('profile:delete', profileId),

  updateProfile: (id, name, avatarColor) =>
    ipcRenderer.invoke('profile:update', { id, name, avatarColor }),

  // File operations
  scanFiles: (scanPath, extensions, mode, includeSubfolders) =>
    ipcRenderer.invoke('files:scan', { scanPath, extensions, mode, includeSubfolders }),

  moveToTrash: (filePaths) =>
    ipcRenderer.invoke('files:moveToTrash', { filePaths }),

  selectFolder: () =>
    ipcRenderer.invoke('files:selectFolder'),

  openWithDefault: (filePath) =>
    ipcRenderer.invoke('files:openWithDefault', filePath),

  // Deletion operations
  createOperation: (profileId, scanPath, deletionMode, fileExtensions, filesData) =>
    ipcRenderer.invoke('operation:create', { profileId, scanPath, deletionMode, fileExtensions, filesData }),

  getOperationDetails: (operationId) =>
    ipcRenderer.invoke('operation:getDetails', operationId),

  // Statistics
  getProfileStatistics: (profileId) =>
    ipcRenderer.invoke('stats:getProfile', profileId),

  getDashboardStats: (profileId) =>
    ipcRenderer.invoke('stats:getDashboard', profileId),

  // Saved Paths operations
  createSavedPath: (profileId, path, name) =>
    ipcRenderer.invoke('savedPath:create', { profileId, path, name }),

  getAllSavedPaths: (profileId) =>
    ipcRenderer.invoke('savedPath:getAll', profileId),

  deleteSavedPath: (id) =>
    ipcRenderer.invoke('savedPath:delete', id),

  updateSavedPath: (id, name) =>
    ipcRenderer.invoke('savedPath:update', { id, name }),

  // Profile Settings operations
  getProfileSettings: (profileId) =>
    ipcRenderer.invoke('profileSettings:get', profileId),

  updateProfileSettings: (profileId, includeSubfolders) =>
    ipcRenderer.invoke('profileSettings:update', { profileId, includeSubfolders }),

  // Auto Updater operations
  checkForUpdates: () =>
    ipcRenderer.invoke('updater:checkForUpdates'),

  downloadUpdate: () =>
    ipcRenderer.invoke('updater:downloadUpdate'),

  installUpdate: () =>
    ipcRenderer.invoke('updater:installUpdate'),

  onUpdateAvailable: (callback) =>
    ipcRenderer.on('update-available', (_event, data) => callback(data)),

  onUpdateNotAvailable: (callback) =>
    ipcRenderer.on('update-not-available', () => callback()),

  onDownloadProgress: (callback) =>
    ipcRenderer.on('download-progress', (_event, data) => callback(data)),

  onUpdateDownloaded: (callback) =>
    ipcRenderer.on('update-downloaded', (_event, data) => callback(data)),

  onUpdateError: (callback) =>
    ipcRenderer.on('update-error', (_event, data) => callback(data)),

  // Recycle Bin / Trash operations
  getTrashItems: () =>
    ipcRenderer.invoke('trash:getItems'),

  permanentDeleteFromTrash: (files, profileId) =>
    ipcRenderer.invoke('trash:permanentDelete', { files, profileId }),

  emptyTrash: (profileId, totalFiles, totalSize) =>
    ipcRenderer.invoke('trash:emptyAll', { profileId, totalFiles, totalSize }),

  // Backup / Restore operations
  exportBackup: () =>
    ipcRenderer.invoke('backup:export'),

  importBackup: () =>
    ipcRenderer.invoke('backup:import'),
});
