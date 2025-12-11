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
  port: 22,
  tryKeyboard: true // Enable keyboard-interactive auth
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
      let awaitingCredential = null; // Track what credential we're waiting for

      // Handle keyboard-interactive authentication
      sshClient.on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
        console.log('Keyboard-interactive auth triggered');
        console.log('Prompts:', prompts);

        // This will be handled by prompts in the data stream instead
        // We'll use a simpler approach with stream interception
        finish([]);
      });

      sshClient.on('ready', () => {
        console.log('SSH connection ready');

        sshClient.shell({ term: 'xterm-256color' }, (err, stream) => {
          if (err) {
            console.error('Shell error:', err);
            reject(err);
            return;
          }

          sshStream = stream;

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

            // Authentication phase - intercept credentials
            if (!authenticationComplete) {
              // Check for username/login prompt
              if ((lowerBuffer.includes('login:') || lowerBuffer.includes('username:')) && !awaitingCredential) {
                awaitingCredential = 'username';
                mainWindow.webContents.send('prompt-username');
                buffer = '';
              }
              // Check for password prompt (initial login)
              else if (lowerBuffer.includes('password:') && !awaitingCredential && !storedPassword) {
                awaitingCredential = 'password';
                mainWindow.webContents.send('prompt-password');
                buffer = '';
              }
              // Check for successful login ($ or # prompt)
              else if ((buffer.includes('$') || buffer.includes('#')) && storedPassword) {
                authenticationComplete = true;
                awaitingCredential = null;
                buffer = '';

                // Start automation sequence
                console.log('Authentication complete, starting automation...');
                setTimeout(() => {
                  automationStep = 0;
                  stream.write('sudo -s\n');
                }, 500);
              }
            }
            // Automation phase
            else if (authenticationComplete && !automationComplete) {
              // Step 1: After sudo -s, check for password prompt
              if (automationStep === 0 && lowerBuffer.includes('password:')) {
                console.log('Sudo password prompt detected, sending stored password...');
                stream.write(storedPassword + '\n');
                buffer = '';
                automationStep = 1;
              }
              // Step 2: After sudo password, wait for root prompt
              else if (automationStep === 1 && buffer.includes('#')) {
                console.log('Root access obtained, sourcing msver...');
                stream.write('. msver\n');
                buffer = '';
                automationStep = 2;
              }
              // Step 3: After msver, change directory
              else if (automationStep === 2 && buffer.includes('#')) {
                console.log('Changing to MedSolution directory...');
                stream.write('cd /usr1/medsol/kapos\n');
                buffer = '';
                automationStep = 3;
              }
              // Step 4: After cd, start msgo
              else if (automationStep === 3 && buffer.includes('#')) {
                console.log('Starting MedSolution application...');
                stream.write('msgo\n');
                buffer = '';
                automationStep = 4;

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

      // Connect without credentials - let the stream handle prompts
      console.log('Connecting to', SSH_CONFIG.host);
      sshClient.connect({
        host: SSH_CONFIG.host,
        port: SSH_CONFIG.port,
        tryKeyboard: true,
        // No username or password - we'll provide them interactively
      });

    } catch (error) {
      console.error('Connection failed:', error);
      reject(error);
    }
  });
});

// Handle username submission from modal
ipcMain.handle('submit-username', async (event, username) => {
  if (sshStream) {
    console.log('Sending username:', username);
    sshStream.write(username + '\n');
  }
  return { success: true };
});

// Handle password submission from modal
ipcMain.handle('submit-password', async (event, password) => {
  if (sshStream) {
    console.log('Sending password (stored for sudo)');
    storedPassword = password; // Store for sudo reuse
    sshStream.write(password + '\n');
  }
  return { success: true };
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
