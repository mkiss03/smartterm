// Terminal instance and state
let terminal = null;
let fitAddon = null;

// DOM elements
const dashboardView = document.getElementById('dashboard-view');
const terminalView = document.getElementById('terminal-view');
const connectBtn = document.getElementById('connect-btn');
const statusLog = document.getElementById('status-log');
const saveBtn = document.getElementById('save-btn');
const exitBtn = document.getElementById('exit-btn');
const restartBtn = document.getElementById('restart-btn');
const terminalContainer = document.getElementById('terminal');

// Initialize terminal
function initTerminal() {
  // Create terminal instance
  terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: 'block',
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
    fontSize: 14,
    lineHeight: 1.2,
    theme: {
      background: '#1e1e1e',
      foreground: '#cccccc',
      cursor: '#ffffff',
      cursorAccent: '#1e1e1e',
      selection: 'rgba(255, 255, 255, 0.3)',
      black: '#000000',
      red: '#cd3131',
      green: '#0dbc79',
      yellow: '#e5e510',
      blue: '#2472c8',
      magenta: '#bc3fbc',
      cyan: '#11a8cd',
      white: '#e5e5e5',
      brightBlack: '#666666',
      brightRed: '#f14c4c',
      brightGreen: '#23d18b',
      brightYellow: '#f5f543',
      brightBlue: '#3b8eea',
      brightMagenta: '#d670d6',
      brightCyan: '#29b8db',
      brightWhite: '#ffffff'
    },
    allowProposedApi: true
  });

  // Create and load fit addon
  fitAddon = new FitAddon.FitAddon();
  terminal.loadAddon(fitAddon);

  // Open terminal in container
  terminal.open(terminalContainer);

  // Fit terminal to container
  fitAddon.fit();

  // Handle terminal input
  terminal.onData((data) => {
    window.electronAPI.sendTerminalInput(data);
  });

  // Handle terminal resize
  terminal.onResize(({ cols, rows }) => {
    window.electronAPI.sendTerminalResize(cols, rows);
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (terminal && fitAddon) {
      fitAddon.fit();
    }
  });
}

// Switch views
function switchToTerminalView() {
  dashboardView.classList.remove('active');
  terminalView.classList.add('active');

  // Fit terminal after view switch
  setTimeout(() => {
    if (fitAddon) {
      fitAddon.fit();
      terminal.focus();
    }
  }, 100);
}

function switchToDashboardView() {
  terminalView.classList.remove('active');
  dashboardView.classList.add('active');
}

// Add status message to log
function addStatusMessage(message, isError = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'status-message' + (isError ? ' error' : '');

  const timestamp = new Date().toLocaleTimeString();
  messageDiv.textContent = `[${timestamp}] ${message}`;

  statusLog.appendChild(messageDiv);
  statusLog.scrollTop = statusLog.scrollHeight;
}

// Clear status log
function clearStatusLog() {
  statusLog.innerHTML = '<div class="status-message">Ready to connect...</div>';
}

// Connect button handler
connectBtn.addEventListener('click', async () => {
  connectBtn.disabled = true;
  connectBtn.textContent = 'Connecting...';
  clearStatusLog();

  try {
    await window.electronAPI.connectSSH();
  } catch (error) {
    addStatusMessage('Connection failed: ' + error.message, true);
    connectBtn.disabled = false;
    connectBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 3C6.13 3 3 6.13 3 10s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
        <circle cx="10" cy="10" r="2"/>
      </svg>
      Connect to MedSolution
    `;
  }
});

// Toolbar button handlers
saveBtn.addEventListener('click', () => {
  // Simulate F2 key press
  if (terminal) {
    terminal.write('\x1bOQ'); // F2 escape sequence
  }
});

exitBtn.addEventListener('click', () => {
  // Simulate F10 key press
  if (terminal) {
    terminal.write('\x1b[21~'); // F10 escape sequence
  }
});

restartBtn.addEventListener('click', async () => {
  if (confirm('Are you sure you want to restart the session?')) {
    await window.electronAPI.restartSession();

    // Clear terminal
    if (terminal) {
      terminal.clear();
    }

    // Switch back to dashboard
    switchToDashboardView();

    // Reset connect button
    connectBtn.disabled = false;
    connectBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 3C6.13 3 3 6.13 3 10s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
        <circle cx="10" cy="10" r="2"/>
      </svg>
      Connect to MedSolution
    `;
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Only handle shortcuts when terminal view is active
  if (!terminalView.classList.contains('active')) return;

  // F2 - Save
  if (e.key === 'F2') {
    e.preventDefault();
    saveBtn.click();
  }

  // F10 - Exit
  if (e.key === 'F10') {
    e.preventDefault();
    exitBtn.click();
  }
});

// IPC Event Listeners
window.electronAPI.onConnectionStatus((message) => {
  addStatusMessage(message);
});

window.electronAPI.onTerminalData((data) => {
  if (terminal) {
    terminal.write(data);
  }
});

window.electronAPI.onAutomationComplete(() => {
  addStatusMessage('Switching to terminal view...');

  // Initialize terminal if not already done
  if (!terminal) {
    initTerminal();
  }

  // Switch to terminal view
  setTimeout(() => {
    switchToTerminalView();
  }, 500);
});

window.electronAPI.onTerminalClosed(() => {
  if (terminal) {
    terminal.write('\r\n\x1b[1;31mConnection closed.\x1b[0m\r\n');
    terminal.write('\x1b[1;33mPress "Restart Session" to reconnect.\x1b[0m\r\n');
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  // Clear initial status
  clearStatusLog();
});
