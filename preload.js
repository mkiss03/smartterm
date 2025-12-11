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

  // Submit username from modal
  submitUsername: (username) => ipcRenderer.invoke('submit-username', username),

  // Submit password from modal
  submitPassword: (password) => ipcRenderer.invoke('submit-password', password),

  // Send input to terminal
  sendTerminalInput: (data) => ipcRenderer.send('terminal-input', data),

  // Send terminal resize
  sendTerminalResize: (cols, rows) => ipcRenderer.send('terminal-resize', { cols, rows }),

  // Listen for terminal data
  onTerminalData: (callback) => {
    ipcRenderer.on('terminal-data', (event, data) => callback(data));
  },

  // Listen for username prompt
  onPromptUsername: (callback) => {
    ipcRenderer.on('prompt-username', () => callback());
  },

  // Listen for password prompt
  onPromptPassword: (callback) => {
    ipcRenderer.on('prompt-password', () => callback());
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
