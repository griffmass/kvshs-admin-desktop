const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { supabaseAdmin, adminFunctions } = require('./supabaseAdmin.js');

// No need for __filename and __dirname in CommonJS

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
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    const devUrl = 'http://localhost:5180'; // Updated to match actual Vite port
    console.log('Attempting to load dev URL:', devUrl);

    // Load URL directly without checking - the require issue is causing problems
    mainWindow.loadURL(devUrl);

    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

if (app) {
  app.whenReady().then(() => {
  createWindow();

  // IPC handler for updating user password in custom admin table
  ipcMain.handle('update-user-password', async (event, { userId, newPassword }) => {
    try {
      console.log('Updating password for userId:', userId);

      const data = await adminFunctions.updateUserPassword(userId, newPassword);

      console.log('Password updated successfully');
      return { success: true, data };
    } catch (error) {
      console.error('Error updating password:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC handler for getting user by email from custom admin table
  ipcMain.handle('get-user-by-email', async (event, email) => {
    try {
      const user = await adminFunctions.getUserByEmail(email);
      return { success: true, user };
    } catch (error) {
      if (error.message.includes('PGRST116')) {
        return { success: false, error: 'User not found' };
      }
      console.error('Error getting user by email:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC handler for storing OTP in database
  ipcMain.handle('store-otp', async (event, { userId, otp, expiresAt }) => {
    try {
      console.log('Storing OTP for userId:', userId, 'OTP:', otp, 'Type:', typeof userId);

      const data = await adminFunctions.storeOTP(userId, otp, expiresAt);

      console.log('OTP stored successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error storing OTP:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }
  });

  // IPC handler for verifying OTP
  ipcMain.handle('verify-otp', async (event, { userId, otp }) => {
    try {
      console.log('Verifying OTP for userId:', userId, 'OTP:', otp);

      const data = await adminFunctions.verifyOTP(userId, otp);

      console.log('OTP verified successfully');
      return { success: true, data: { userId: data.user_id } };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC handler for generating access token for password reset (simplified)
  ipcMain.handle('generate-reset-token', async (event, userId) => {
    try {
      // Generate a simple token for password reset verification
      const token = `reset_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return { success: true, token };
    } catch (error) {
      console.error('Error generating reset token:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC handler for admin login
  ipcMain.handle('login-admin', async (event, email, password) => {
    try {
      console.log('Attempting admin login for:', email);

      const user = await adminFunctions.loginAdmin(email, password);

      console.log('Admin login successful for:', email);
      return { success: true, user };
    } catch (error) {
      console.error('Error during admin login:', error);
      return { success: false, error: error.message };
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  });
} else {
  console.error('Electron app is not available');
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
