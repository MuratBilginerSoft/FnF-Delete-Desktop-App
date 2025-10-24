const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
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
  scanFiles: (scanPath, extensions, mode) =>
    ipcRenderer.invoke('files:scan', { scanPath, extensions, mode }),

  moveToTrash: (filePaths) =>
    ipcRenderer.invoke('files:moveToTrash', { filePaths }),

  selectFolder: () =>
    ipcRenderer.invoke('files:selectFolder'),

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
});
