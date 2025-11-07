const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const url = require("url");

// This logic correctly finds the .env file whether the app is packaged or in development.
const envPath = app.isPackaged
  ? path.join(path.dirname(app.getPath("exe")), ".env")
  : path.join(__dirname, "..", ".env");

require("dotenv").config({ path: envPath });

const adminFunctions = require("./adminFunctions.cjs");

// Addresses potential rendering issues on some hardware
app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, "../public/Logo.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
    autoHideMenuBar: true,
    backgroundColor: "#ffffff",
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "../dist/index.html"),
        protocol: "file:",
        slashes: true,
      })
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // --- All IPC Handlers ---
  ipcMain.handle("login-admin", async (event, email, password) => {
    try {
      const user = await adminFunctions.loginAdmin(email, password);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("get-user-by-email", async (event, email) => {
    try {
      const user = await adminFunctions.getUserByEmail(email);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("store-otp", async (event, { userId, otp, expiresAt }) => {
    try {
      const result = await adminFunctions.storeOTP(userId, otp, expiresAt);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("verify-otp", async (event, { userId, otp }) => {
    try {
      const result = await adminFunctions.verifyOTP(userId, otp);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    "update-user-password",
    async (event, { userId, newPassword }) => {
      try {
        const result = await adminFunctions.updateUserPassword(
          userId,
          newPassword
        );
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle("generate-reset-token", async (event, userId) => {
    try {
      const result = await adminFunctions.generateResetToken(userId);
      // The result from adminFunctions already contains the token
      return { success: true, token: result.token };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
 
  ipcMain.handle("generate-reset-token", async (event, userId) => {
    try {
      const result = await adminFunctions.generateResetToken(userId);
      // The result from adminFunctions now contains our simple token
      return { success: true, token: result.token };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });  
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
