const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Client } = require('ssh2');

let mainWindow;
let sshClient = null;
let sshStream = null;
let automationComplete = false;

// SSH Configuration (replace USER_NAME and PASSWORD with actual credentials)
const SSH_CONFIG = {
  host: '10.1.1.1',
  port: 22,
  username: 'USER_NAME',
  password: 'PASSWORD'
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false
  });

  mainWindow.loadFile('index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    if (sshClient) {
      sshClient.end();
    }
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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('connect-ssh', async () => {
  return new Promise((resolve, reject) => {
    try {
      sshClient = new Client();
      let buffer = '';
      let automationStep = 0;

      sshClient.on('ready', () => {
        sendStatus('Connected to server');

        sshClient.shell({ term: 'xterm-256color' }, (err, stream) => {
          if (err) {
            sendStatus('Error creating shell: ' + err.message);
            reject(err);
            return;
          }

          sshStream = stream;
          sendStatus('Shell session started');

          stream.on('data', (data) => {
            const chunk = data.toString('utf8');
            buffer += chunk;

            // During automation phase
            if (!automationComplete) {
              // Send the data to renderer for status display
              sendStatus(`Received: ${chunk.trim().substring(0, 50)}...`);

              // Automation sequence
              if (automationStep === 0 && buffer.includes('$')) {
                sendStatus('User prompt detected, elevating to root...');
                stream.write('sudo -s\n');
                buffer = '';
                automationStep = 1;
              }
              else if (automationStep === 1 && buffer.toLowerCase().includes('password')) {
                sendStatus('Password prompt detected, authenticating...');
                stream.write(SSH_CONFIG.password + '\n');
                buffer = '';
                automationStep = 2;
              }
              else if (automationStep === 2 && buffer.includes('#')) {
                sendStatus('Root access obtained, sourcing msver...');
                stream.write('. msver\n');
                buffer = '';
                automationStep = 3;
              }
              else if (automationStep === 3 && buffer.includes('#')) {
                sendStatus('Changing to MedSolution directory...');
                stream.write('cd /usr1/medsol/kapos\n');
                buffer = '';
                automationStep = 4;
              }
              else if (automationStep === 4 && buffer.includes('#')) {
                sendStatus('Starting MedSolution application...');
                stream.write('msgo\n');
                buffer = '';
                automationStep = 5;

                // Wait a moment for msgo to start, then hand over control
                setTimeout(() => {
                  automationComplete = true;
                  sendStatus('Automation complete. Terminal ready.');

                  // Signal renderer to switch to terminal view
                  mainWindow.webContents.send('automation-complete');

                  // Resolve the promise
                  resolve({ success: true });
                }, 1000);
              }
            } else {
              // After automation, send all data to terminal
              mainWindow.webContents.send('terminal-data', chunk);
            }
          });

          stream.on('close', () => {
            sendStatus('SSH connection closed');
            mainWindow.webContents.send('terminal-closed');
          });

          stream.stderr.on('data', (data) => {
            const errorMsg = data.toString('utf8');
            if (!automationComplete) {
              sendStatus('Error: ' + errorMsg);
            } else {
              mainWindow.webContents.send('terminal-data', errorMsg);
            }
          });
        });
      });

      sshClient.on('error', (err) => {
        sendStatus('SSH Error: ' + err.message);
        reject(err);
      });

      sshClient.on('close', () => {
        sendStatus('Connection closed');
        sshClient = null;
        sshStream = null;
        automationComplete = false;
      });

      sendStatus('Connecting to ' + SSH_CONFIG.host + '...');
      sshClient.connect(SSH_CONFIG);

    } catch (error) {
      sendStatus('Connection failed: ' + error.message);
      reject(error);
    }
  });
});

// Handle terminal input from renderer
ipcMain.on('terminal-input', (event, data) => {
  if (sshStream && automationComplete) {
    sshStream.write(data);
  }
});

// Handle terminal resize
ipcMain.on('terminal-resize', (event, { cols, rows }) => {
  if (sshStream) {
    sshStream.setWindow(rows, cols, 0, 0);
  }
});

// Handle restart session
ipcMain.handle('restart-session', async () => {
  if (sshClient) {
    sshClient.end();
  }
  automationComplete = false;
  sendStatus('Session restarted. Ready to reconnect.');
  return { success: true };
});

// Handle disconnect
ipcMain.handle('disconnect-ssh', async () => {
  if (sshClient) {
    sshClient.end();
  }
  automationComplete = false;
  return { success: true };
});

// Helper function to send status messages to renderer
function sendStatus(message) {
  if (mainWindow) {
    mainWindow.webContents.send('connection-status', message);
  }
}
