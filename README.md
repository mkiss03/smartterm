# MedSolution Launcher

A modern Electron desktop application with interactive SSH terminal access to MedSolution systems. Features smart credential interception with beautiful modal dialogs instead of traditional black-box terminal input.

![MedSolution Launcher](https://img.shields.io/badge/electron-latest-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Key Features

### Interactive Authentication Flow
- **Smart Credential Interception**: Modern modal dialogs capture username and password instead of typing into the terminal
- **Password Reuse**: The app securely stores your password during the session and automatically reuses it for `sudo` prompts
- **Visual Feedback**: See the terminal output in the background while entering credentials through beautiful UI modals

### Modern UI
- **Dark Theme**: VS Code-inspired modern dark interface with smooth animations
- **Modal Dialogs**: Professional credential input with password visibility toggle
- **Real-time Terminal**: Full xterm.js terminal integration with custom color scheme
- **Quick Actions**: F2 Save, F10 Exit, and session restart buttons

### Automated Workflow
- **Zero-Touch Automation**: After initial authentication, the app automatically:
  - Elevates to root with `sudo -s`
  - Sources MedSolution environment (`. msver`)
  - Navigates to working directory (`cd /usr1/medsol/kapos`)
  - Launches MedSolution (`msgo`)

## Technology Stack

- **Electron 28.0.0** - Desktop application framework
- **xterm.js 5.3.0** - Professional terminal emulator
- **xterm-addon-fit 0.8.0** - Responsive terminal resizing
- **ssh2 1.15.0** - Full-featured SSH2 client

## Installation

```bash
npm install
```

## Quick Start

### 1. Start the Application

```bash
npm start
```

### 2. Connect to MedSolution

1. Click "Connect to MedSolution" button on the dashboard
2. The terminal view appears with an SSH connection established
3. A modal dialog will prompt you for your **username**
4. Enter your username and click "Continue"
5. A modal dialog will prompt you for your **password**
6. Enter your password and click "Authenticate"
7. Watch the magic happen! 🎩✨

### 3. Automated Sequence

Once authenticated, the app automatically:

1. ✅ Sends `sudo -s` to elevate privileges
2. ✅ **Automatically reuses your password** for sudo (no second prompt!)
3. ✅ Sources the MedSolution environment with `. msver`
4. ✅ Changes directory to `/usr1/medsol/kapos`
5. ✅ Launches MedSolution with `msgo`
6. ✅ Hands over full terminal control to you

### 4. Use MedSolution

- All modals disappear
- Terminal is focused and ready
- Interact normally with the MedSolution TUI
- Use F2 to save, F10 to exit (or toolbar buttons)

## User Experience Flow

```
┌─────────────────────────────────────────┐
│         Dashboard (Start Screen)        │
│                                         │
│  [Connect to MedSolution Button]        │
└─────────────────────────────────────────┘
                    │
                    ▼ (Click Connect)
┌─────────────────────────────────────────┐
│      Terminal View (Background)         │
│  ┌───────────────────────────────────┐  │
│  │    Username Modal (Foreground)    │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Enter username:            │  │  │
│  │  │  [_________________]        │  │  │
│  │  │         [Continue]          │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼ (Submit Username)
┌─────────────────────────────────────────┐
│      Terminal View (Background)         │
│  ┌───────────────────────────────────┐  │
│  │    Password Modal (Foreground)    │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Enter password:            │  │  │
│  │  │  [••••••••••••••] 👁        │  │  │
│  │  │      [Authenticate]         │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼ (Submit Password)
┌─────────────────────────────────────────┐
│   Automation Running (Background)       │
│   • sudo -s (auto-uses password)        │
│   • . msver                             │
│   • cd /usr1/medsol/kapos              │
│   • msgo                                │
└─────────────────────────────────────────┘
                    │
                    ▼ (Automation Complete)
┌─────────────────────────────────────────┐
│        Full Terminal Control            │
│  (No modals, focused, ready to use)     │
│                                         │
│  Terminal with MedSolution running...   │
│                                         │
│  [F2 Save] [F10 Exit] [Restart]         │
└─────────────────────────────────────────┘
```

## Features in Detail

### Interactive Credential Capture

Unlike traditional SSH terminals where you type blindly into a black box, MedSolution Launcher intercepts authentication prompts and presents them as modern UI dialogs:

- **Username Modal**: Clean input field with icon and description
- **Password Modal**: Secure input with visibility toggle (eye icon)
- **Visual Context**: Terminal output visible in background while you authenticate

### Intelligent Password Management

The app stores your password **only in memory for the current session**:
- Used once for initial SSH authentication
- Automatically reused for `sudo -s` password prompt
- Cleared when the session ends or app closes
- Never written to disk

### Keyboard Shortcuts

- **F2** - Send save command to MedSolution
- **F10** - Send exit command to MedSolution
- **Enter** - Submit credentials in modals

### Session Management

- **Restart Session** - Disconnects SSH, clears terminal, returns to dashboard
- **Connection Indicator** - Real-time status dot showing connection state
- **Error Handling** - Graceful error messages and recovery options

## Configuration

The default SSH server is configured in `main.js`:

```javascript
const SSH_CONFIG = {
  host: '10.1.1.1',
  port: 22,
  tryKeyboard: true
};
```

To connect to a different server, update the `host` and `port` values.

## Automation Customization

The automation sequence can be customized in `main.js` (lines 140-180). The default sequence:

```javascript
1. sudo -s              // Elevate to root
2. . msver              // Source environment
3. cd /usr1/medsol/kapos  // Change directory
4. msgo                 // Launch MedSolution
```

## Security Notes

### Current Implementation
- ⚠️ Password stored in memory during session
- ✅ Password never written to disk
- ✅ Password cleared on disconnect
- ✅ Context isolation enabled
- ✅ No node integration in renderer

### Production Recommendations
- Use SSH key-based authentication
- Implement encrypted credential storage
- Add two-factor authentication support
- Enable audit logging
- Restrict file permissions

## Project Structure

```
medsolution-launcher/
├── main.js              # Main process - SSH automation & IPC
├── preload.js           # Secure context bridge
├── renderer.js          # UI logic - modals, terminal, events
├── index.html           # Application UI - dashboard, terminal, modals
├── styles.css           # Modern dark theme with modal styles
├── package.json         # Dependencies & scripts
├── config.example.json  # Configuration template
├── assets/              # Application icons
└── README.md           # This file
```

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to SSH server

**Solutions**:
- Verify server is reachable: `ping 10.1.1.1`
- Check firewall allows SSH (port 22)
- Ensure correct server address in `main.js`

### Authentication Issues

**Problem**: Username/password modal doesn't appear

**Solutions**:
- Check browser console (View → Toggle Developer Tools)
- Verify SSH server sends proper prompts
- Check main process logs for errors

**Problem**: Stuck at username prompt

**Solutions**:
- Make sure to press Enter or click "Continue"
- Check that username is valid
- Restart the session and try again

### Automation Issues

**Problem**: Automation stops before msgo

**Solutions**:
- Check prompt detection patterns in `main.js`
- Verify paths exist on server (`/usr1/medsol/kapos`)
- Check console for automation step logs

### Terminal Display Issues

**Problem**: Terminal looks wrong or text is cut off

**Solutions**:
- Try resizing the window
- Click "Restart Session"
- Check that xterm.js loaded correctly

## Development

### Debug Mode

Run with developer tools open:
```bash
npm start
```

Then: View → Toggle Developer Tools

### Console Logging

The app logs all automation steps to console:
```
Username prompt received
Sending username: your_username
Password prompt received
Sending password (stored for sudo)
Sudo password prompt detected, sending stored password...
Root access obtained, sourcing msver...
...
```

### Building for Distribution

1. Install electron-builder:
```bash
npm install --save-dev electron-builder
```

2. Add to package.json:
```json
"scripts": {
  "build": "electron-builder"
}
```

3. Build:
```bash
npm run build
```

## FAQ

**Q: Is my password safe?**
A: The password is stored only in memory during your session and never written to disk. It's cleared when you disconnect or close the app. For production use, we recommend SSH key-based authentication.

**Q: Can I connect to multiple servers?**
A: Currently, the app is configured for one server. You can modify `main.js` to support multiple server profiles.

**Q: Can I skip the automation?**
A: Yes, you can comment out the automation steps in `main.js` (lines 134-178) to have manual control from the start.

**Q: Does it work on Windows/Mac/Linux?**
A: Yes! Electron apps work on all three platforms. The SSH client (ssh2) is cross-platform.

**Q: Can I customize the terminal colors?**
A: Yes, edit the theme object in `renderer.js` (lines 41-62).

## Changelog

### Version 2.0.0 - Interactive Authentication
- ✨ NEW: Interactive modal-based credential capture
- ✨ NEW: Password visibility toggle
- ✨ NEW: Smart password reuse for sudo
- ✨ NEW: Modern modal dialogs with animations
- 🎨 IMPROVED: Simplified dashboard (removed status log)
- 🎨 IMPROVED: Terminal visible during authentication
- ⚡ IMPROVED: Smoother automation flow
- 🐛 FIXED: More reliable prompt detection

### Version 1.0.0 - Initial Release
- Basic SSH connection with hardcoded credentials
- Automated login sequence
- Modern dark UI theme
- xterm.js terminal integration
- Quick action buttons

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Check the troubleshooting section above
- Review console logs in developer tools
- Check that your SSH server is compatible
- Verify all automation paths exist on your server

---

**Built with ❤️ for MedSolution users**

*Making terminal access beautiful, one modal at a time* ✨
