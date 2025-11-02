import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from './supabaseAdmin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const devUrl = 'http://localhost:5174'; // Updated to match actual Vite port
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

app.whenReady().then(() => {
  createWindow();

  // IPC handler for updating user password in custom admin table
  ipcMain.handle('update-user-password', async (event, { userId, newPassword }) => {
    try {
      console.log('Updating password for userId:', userId);

      // userId is string from frontend, convert to integer for admin table
      const userIdInt = parseInt(userId, 10);

      const { data, error } = await supabaseAdmin
        .from('admin')
        .update({ password: newPassword, updated_at: new Date().toISOString() })
        .eq('id', userIdInt)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating password:', error);
        throw error;
      }

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
      const { data, error } = await supabaseAdmin
        .from('admin')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return { success: false, error: 'User not found' };
        }
        throw error;
      }

      return { success: true, user: data };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC handler for storing OTP in database
  ipcMain.handle('store-otp', async (event, { userId, otp, expiresAt }) => {
    try {
      console.log('Storing OTP for userId:', userId, 'OTP:', otp, 'Type:', typeof userId);

      // Convert userId to integer for int8 column
      const userIdInt = parseInt(userId, 10);
      console.log('Converted userId to int:', userIdInt);

      const { data, error } = await supabaseAdmin
        .from('password_reset_otps')
        .insert({
          user_id: userIdInt, // Use integer for int8 column
          otp: otp,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error storing OTP:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

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

      // Convert userId to integer for int8 column
      const userIdInt = parseInt(userId, 10);

      const { data, error } = await supabaseAdmin
        .from('password_reset_otps')
        .select('*')
        .eq('user_id', userIdInt) // Use integer for int8 column
        .eq('otp', otp)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.log('OTP verification failed:', error);
        return { success: false, error: 'Invalid or expired OTP' };
      }

      console.log('OTP verified successfully');

      // Delete the used OTP
      await supabaseAdmin
        .from('password_reset_otps')
        .delete()
        .eq('id', data.id);

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

      const { data, error } = await supabaseAdmin
        .from('admin')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return { success: false, error: 'Invalid email or password' };
        }
        throw error;
      }

      // Check password directly (no hashing)
      if (password !== data.password) {
        return { success: false, error: 'Invalid email or password' };
      }

      console.log('Admin login successful for:', email);
      return { success: true, user: { id: data.id, email: data.email } };
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
