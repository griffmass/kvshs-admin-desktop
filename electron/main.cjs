const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const adminFunctions = require('./adminFunctions.cjs');

// Addresses potential rendering issues on some hardware
app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows loading local file resources
      preload: path.join(__dirname, 'preload.cjs')
    },
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Use the robust URL format method for loading the production build
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, '../dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This function will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // --- All IPC Handlers are placed here ---

  ipcMain.handle('update-user-password', async (event, { userId, newPassword }) => {
    try {
      const data = await adminFunctions.updateUserPassword(userId, newPassword);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-user-by-email', async (event, email) => {
    try {
      const user = await adminFunctions.getUserByEmail(email);
      return { success: true, user };
    } catch (error) {
      if (error.message.includes('PGRST116')) {
        return { success: false, error: 'User not found' };
      }
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('store-otp', async (event, { userId, otp, expiresAt }) => {
    try {
      const data = await adminFunctions.storeOTP(userId, otp, expiresAt);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('verify-otp', async (event, { userId, otp }) => {
    try {
      const data = await adminFunctions.verifyOTP(userId, otp);
      return { success: true, data: { userId: data.user_id } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('generate-reset-token', async (event, userId) => {
    try {
      const token = `reset_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return { success: true, token };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('login-admin', async (event, email, password) => {
    try {
      const user = await adminFunctions.loginAdmin(email, password);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});