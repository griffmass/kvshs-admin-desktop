const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

// This logic correctly finds the .env file whether the app is packaged or in development.
const envPath = app.isPackaged
  ? path.join(path.dirname(app.getPath('exe')), '.env')
  : path.join(__dirname, '..', '.env');

require('dotenv').config({ path: envPath });

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
    icon: path.join(__dirname, '../public/Logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // --- All IPC Handlers ---
  ipcMain.handle('login-admin', async (event, email, password) => {
    try {
      const user = await adminFunctions.loginAdmin(email, password);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // (Add your other ipcMain.handle calls here if you have them)
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});