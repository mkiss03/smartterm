const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Client } = require('ssh2');

let mainWindow;
let sshClient = null;
let sshStream = null;
let automationComplete = false;
let storedPassword = null; // Store password for sudo reuse
let authenticationComplete = false;

// SSH Configuration
const SSH_CONFIG = {
  host: '10.1.1.1',
  port: 22
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
ipcMain.handle('connect-ssh', async (event, { username, password }) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Connecting to SSH with username:', username);

      // Store password for sudo later
      storedPassword = password;

      sshClient = new Client();
      let buffer = '';
      let automationStep = 0;

      sshClient.on('ready', () => {
        console.log('SSH connection ready');

        sshClient.shell({ term: 'xterm-256color' }, (err, stream) => {
          if (err) {
            console.error('Shell error:', err);
            reject(err);
            return;
          }

          sshStream = stream;
          authenticationComplete = true;

          // Signal renderer to show terminal view
          mainWindow.webContents.send('show-terminal');

          stream.on('data', (data) => {
            const chunk = data.toString('utf8');
            buffer += chunk;

            // Always send data to terminal for visual feedback
            mainWindow.webContents.send('terminal-data', chunk);

            console.log('Received:', chunk.substring(0, 100));

            // Check for various prompts
            const lowerBuffer = buffer.toLowerCase();

            // Automation phase - starts after successful SSH auth
            if (authenticationComplete && !automationComplete) {
              // Step 0: Wait for initial prompt, then send sudo
              if (automationStep === 0 && (buffer.includes('$') || buffer.includes('#'))) {
                console.log('Initial prompt detected, elevating to root...');
                stream.write('sudo -s\n');
                buffer = '';
                automationStep = 1;
              }
              // Step 1: After sudo -s, check for password prompt
              else if (automationStep === 1 && lowerBuffer.includes('password:')) {
                console.log('Sudo password prompt detected, sending stored password...');
                stream.write(storedPassword + '\n');
                buffer = '';
                automationStep = 2;
              }
              // Step 2: After sudo password, wait for root prompt
              else if (automationStep === 2 && buffer.includes('#')) {
                console.log('Root access obtained, sourcing msver...');
                stream.write('. msver\n');
                buffer = '';
                automationStep = 3;
              }
              // Step 3: After msver, change directory
              else if (automationStep === 3 && buffer.includes('#')) {
                console.log('Changing to MedSolution directory...');
                stream.write('cd /usr1/medsol/kapos\n');
                buffer = '';
                automationStep = 4;
              }
              // Step 4: After cd, start msgo
              else if (automationStep === 4 && buffer.includes('#')) {
                console.log('Starting MedSolution application...');
                stream.write('msgo\n');
                buffer = '';
                automationStep = 5;

                // Wait a moment for msgo to start, then complete automation
                setTimeout(() => {
                  automationComplete = true;
                  console.log('Automation complete!');

                  // Signal renderer to hide modals and focus terminal
                  mainWindow.webContents.send('automation-complete');
                  resolve({ success: true });
                }, 1000);
              }
            }
          });

          stream.on('close', () => {
            console.log('Stream closed');
            mainWindow.webContents.send('terminal-closed');
            resetState();
          });

          stream.stderr.on('data', (data) => {
            const errorMsg = data.toString('utf8');
            mainWindow.webContents.send('terminal-data', errorMsg);
          });
        });
      });

      sshClient.on('error', (err) => {
        console.error('SSH Error:', err);
        mainWindow.webContents.send('connection-error', err.message);
        reject(err);
      });

      sshClient.on('close', () => {
        console.log('SSH connection closed');
        resetState();
      });

      // Connect with username and password
      sshClient.connect({
        host: SSH_CONFIG.host,
        port: SSH_CONFIG.port,
        username: username,
        password: password
      });

    } catch (error) {
      console.error('Connection failed:', error);
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
  resetState();
  return { success: true };
});

// Handle disconnect
ipcMain.handle('disconnect-ssh', async () => {
  if (sshClient) {
    sshClient.end();
  }
  resetState();
  return { success: true };
});

// Reset all state
function resetState() {
  sshClient = null;
  sshStream = null;
  automationComplete = false;
  authenticationComplete = false;
  storedPassword = null;
}
