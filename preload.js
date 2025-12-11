const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Connect to SSH
  connectSSH: () => ipcRenderer.invoke('connect-ssh'),

  // Disconnect SSH
  disconnectSSH: () => ipcRenderer.invoke('disconnect-ssh'),

  // Restart session
  restartSession: () => ipcRenderer.invoke('restart-session'),

  // Send input to terminal
  sendTerminalInput: (data) => ipcRenderer.send('terminal-input', data),

  // Send terminal resize
  sendTerminalResize: (cols, rows) => ipcRenderer.send('terminal-resize', { cols, rows }),

  // Listen for connection status updates
  onConnectionStatus: (callback) => {
    ipcRenderer.on('connection-status', (event, message) => callback(message));
  },

  // Listen for terminal data
  onTerminalData: (callback) => {
    ipcRenderer.on('terminal-data', (event, data) => callback(data));
  },

  // Listen for automation complete signal
  onAutomationComplete: (callback) => {
    ipcRenderer.on('automation-complete', () => callback());
  },

  // Listen for terminal closed
  onTerminalClosed: (callback) => {
    ipcRenderer.on('terminal-closed', () => callback());
  }
});
