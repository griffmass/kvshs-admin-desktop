const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  updateUserPassword: (userId, newPassword) =>
    ipcRenderer.invoke('update-user-password', { userId, newPassword }),

  getUserByEmail: (email) =>
    ipcRenderer.invoke('get-user-by-email', email),

  storeOtp: (userId, otp, expiresAt) =>
    ipcRenderer.invoke('store-otp', { userId, otp, expiresAt }),

  verifyOtp: (userId, otp) =>
    ipcRenderer.invoke('verify-otp', { userId, otp }),

  generateResetToken: (userId) =>
    ipcRenderer.invoke('generate-reset-token', userId),

  loginAdmin: (email, password) =>
    ipcRenderer.invoke('login-admin', email, password),
});