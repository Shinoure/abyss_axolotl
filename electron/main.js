
const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const http = require("http");

const PORT = 3187;
let serverLoaded = false;

function waitForServer(attempts = 50) {
  return new Promise((resolve, reject) => {
    function check(remaining) {
      const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
        res.resume();
        resolve();
      });

      req.on("error", () => {
        if (remaining <= 0) {
          reject(new Error("Не удалось запустить игровой сервер."));
          return;
        }

        setTimeout(() => check(remaining - 1), 200);
      });
    }

    check(attempts);
  });
}

async function createWindow() {
  try {
    if (!serverLoaded) {
      process.env.PORT = String(PORT);

      require(path.join(__dirname, "..", "server.js"));

      serverLoaded = true;
    }

    await waitForServer();

    const win = new BrowserWindow({
      width: 1280,
      height: 850,
      minWidth: 900,
      minHeight: 650,
      backgroundColor: "#07131e",
      title: "ABYSS — Axolotl Club",
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    win.loadURL(`http://127.0.0.1:${PORT}`);
  } catch (error) {
    dialog.showErrorBox(
      "ABYSS — ошибка запуска",
      error.stack || error.message
    );

    app.quit();
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
