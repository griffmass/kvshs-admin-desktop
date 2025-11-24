const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const url = require("url");

const envPath = app.isPackaged
  ? path.join(path.dirname(app.getPath("exe")), ".env")
  : path.join(__dirname, "..", ".env");

require("dotenv").config({ path: envPath });

const adminFunctions = require("./adminFunctions.cjs");

app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1070,
    minWidth: 1920,
    minHeight: 1070,
    // --- FIX: Use favicon.ico instead of Logo.png ---
    icon: path.join(__dirname, "../public/favicon.ico"),
    // ------------------------------------------------
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

  // --- IPC Handlers ---
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

  ipcMain.handle("update-user-password", async (event, { userId, newPassword }) => {
    try {
      const result = await adminFunctions.updateUserPassword(userId, newPassword);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("generate-reset-token", async (event, userId) => {
    try {
      const result = await adminFunctions.generateResetToken(userId);
      return { success: true, token: result.token };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
