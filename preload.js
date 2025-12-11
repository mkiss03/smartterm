const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Connect to SSH with credentials
  connectSSH: (username, password) => ipcRenderer.invoke('connect-ssh', { username, password }),

  // Disconnect SSH
  disconnectSSH: () => ipcRenderer.invoke('disconnect-ssh'),

  // Restart session
  restartSession: () => ipcRenderer.invoke('restart-session'),

  // Send input to terminal
  sendTerminalInput: (data) => ipcRenderer.send('terminal-input', data),

  // Send terminal resize
  sendTerminalResize: (cols, rows) => ipcRenderer.send('terminal-resize', { cols, rows }),

  // Listen for terminal data
  onTerminalData: (callback) => {
    ipcRenderer.on('terminal-data', (event, data) => callback(data));
  },

  // Listen for show terminal signal
  onShowTerminal: (callback) => {
    ipcRenderer.on('show-terminal', () => callback());
  },

  // Listen for automation complete signal
  onAutomationComplete: (callback) => {
    ipcRenderer.on('automation-complete', () => callback());
  },

  // Listen for terminal closed
  onTerminalClosed: (callback) => {
    ipcRenderer.on('terminal-closed', () => callback());
  },

  // Listen for connection errors
  onConnectionError: (callback) => {
    ipcRenderer.on('connection-error', (event, message) => callback(message));
  }
});
