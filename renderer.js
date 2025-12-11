// Terminal instance and state
let terminal = null;
let fitAddon = null;

// DOM elements - Views
const dashboardView = document.getElementById('dashboard-view');
const terminalView = document.getElementById('terminal-view');

// DOM elements - Dashboard
const connectBtn = document.getElementById('connect-btn');

// DOM elements - Terminal controls
const saveBtn = document.getElementById('save-btn');
const exitBtn = document.getElementById('exit-btn');
const restartBtn = document.getElementById('restart-btn');
const terminalContainer = document.getElementById('terminal');

// DOM elements - Modals
const usernameModal = document.getElementById('username-modal');
const usernameInput = document.getElementById('username-input');
const usernameSubmit = document.getElementById('username-submit');

const passwordModal = document.getElementById('password-modal');
const passwordInput = document.getElementById('password-input');
const passwordSubmit = document.getElementById('password-submit');
const togglePassword = document.getElementById('toggle-password');
const eyeClosed = document.getElementById('eye-closed');
const eyeOpen = document.getElementById('eye-open');

// Initialize terminal
function initTerminal() {
  if (terminal) return; // Already initialized

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

// Modal functions
function showModal(modal) {
  modal.classList.add('show');

  // Focus the input
  setTimeout(() => {
    const input = modal.querySelector('input');
    if (input) {
      input.value = '';
      input.focus();
    }
  }, 100);
}

function hideModal(modal) {
  modal.classList.remove('show');
  const input = modal.querySelector('input');
  if (input) {
    input.value = '';
  }
}

function hideAllModals() {
  hideModal(usernameModal);
  hideModal(passwordModal);
}

// Switch views
function switchToTerminalView() {
  dashboardView.classList.remove('active');
  terminalView.classList.add('active');

  // Fit terminal after view switch
  setTimeout(() => {
    if (fitAddon) {
      fitAddon.fit();
    }
  }, 100);
}

function switchToDashboardView() {
  terminalView.classList.remove('active');
  dashboardView.classList.add('active');
  hideAllModals();
}

// Connect button handler
connectBtn.addEventListener('click', async () => {
  connectBtn.disabled = true;
  connectBtn.innerHTML = '<span>Connecting...</span>';

  try {
    // Initialize terminal before connecting
    initTerminal();

    // Start SSH connection
    await window.electronAPI.connectSSH();

    // Connection started successfully
    // The flow will continue via IPC events
  } catch (error) {
    console.error('Connection error:', error);
    connectBtn.disabled = false;
    connectBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
      <span>Connect to MedSolution</span>
    `;
    alert('Connection failed: ' + error.message);
  }
});

// Username modal handlers
usernameSubmit.addEventListener('click', async () => {
  const username = usernameInput.value.trim();

  if (!username) {
    usernameInput.focus();
    return;
  }

  usernameSubmit.disabled = true;
  usernameSubmit.innerHTML = '<span>Submitting...</span>';

  await window.electronAPI.submitUsername(username);

  usernameSubmit.disabled = false;
  usernameSubmit.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
    </svg>
    <span>Continue</span>
  `;

  hideModal(usernameModal);
});

usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    usernameSubmit.click();
  }
});

// Password modal handlers
passwordSubmit.addEventListener('click', async () => {
  const password = passwordInput.value;

  if (!password) {
    passwordInput.focus();
    return;
  }

  passwordSubmit.disabled = true;
  passwordSubmit.innerHTML = '<span>Authenticating...</span>';

  await window.electronAPI.submitPassword(password);

  passwordSubmit.disabled = false;
  passwordSubmit.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
    </svg>
    <span>Authenticate</span>
  `;

  hideModal(passwordModal);
});

passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    passwordSubmit.click();
  }
});

// Toggle password visibility
togglePassword.addEventListener('click', () => {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeClosed.style.display = 'none';
    eyeOpen.style.display = 'block';
    togglePassword.title = 'Hide password';
  } else {
    passwordInput.type = 'password';
    eyeClosed.style.display = 'block';
    eyeOpen.style.display = 'none';
    togglePassword.title = 'Show password';
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
      terminal.dispose();
      terminal = null;
    }

    // Switch back to dashboard
    switchToDashboardView();

    // Reset connect button
    connectBtn.disabled = false;
    connectBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
      <span>Connect to MedSolution</span>
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

// When prompted for username
window.electronAPI.onPromptUsername(() => {
  console.log('Username prompt received');
  showModal(usernameModal);
});

// When prompted for password
window.electronAPI.onPromptPassword(() => {
  console.log('Password prompt received');
  showModal(passwordModal);
});

// When terminal should be shown
window.electronAPI.onShowTerminal(() => {
  console.log('Show terminal signal received');
  switchToTerminalView();
});

// When terminal data arrives
window.electronAPI.onTerminalData((data) => {
  if (terminal) {
    terminal.write(data);
  }
});

// When automation is complete
window.electronAPI.onAutomationComplete(() => {
  console.log('Automation complete!');

  // Hide all modals
  hideAllModals();

  // Focus terminal
  if (terminal) {
    setTimeout(() => {
      terminal.focus();
    }, 200);
  }
});

// When terminal closes
window.electronAPI.onTerminalClosed(() => {
  console.log('Terminal closed');
  if (terminal) {
    terminal.write('\r\n\x1b[1;31mConnection closed.\x1b[0m\r\n');
    terminal.write('\x1b[1;33mClick "Restart Session" to reconnect.\x1b[0m\r\n');
  }
});

// When connection error occurs
window.electronAPI.onConnectionError((message) => {
  console.error('Connection error:', message);

  // Hide all modals
  hideAllModals();

  // Show error in terminal if available
  if (terminal) {
    terminal.write(`\r\n\x1b[1;31mConnection Error: ${message}\x1b[0m\r\n`);
  }

  // Alert user
  alert('Connection error: ' + message);

  // Reset if we're still on dashboard
  if (dashboardView.classList.contains('active')) {
    connectBtn.disabled = false;
    connectBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
      <span>Connect to MedSolution</span>
    `;
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('MedSolution Launcher ready');
});
