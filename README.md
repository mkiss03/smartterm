# MedSolution Launcher

A modern Electron desktop application for automated SSH terminal access to MedSolution systems.

![MedSolution Launcher](https://img.shields.io/badge/electron-latest-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Modern Dark UI**: Sleek, VS Code-inspired interface
- **Automated SSH Login**: Automatically connects and navigates through sudo prompts
- **Custom Terminal**: Built with xterm.js for a native terminal experience
- **Quick Actions**: F2 Save, F10 Exit, and session restart buttons
- **Status Logging**: Real-time connection status updates
- **Secure**: Uses context isolation and secure IPC communication

## Technology Stack

- **Electron** - Desktop application framework
- **xterm.js** - Terminal emulator
- **ssh2** - SSH client for Node.js
- **HTML/CSS** - Modern dark theme UI

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Access to MedSolution server (10.1.1.1)

## Installation

1. Clone or extract the project

2. Install dependencies:
```bash
npm install
```

3. Configure SSH credentials:

   Open `main.js` and update the SSH configuration:
   ```javascript
   const SSH_CONFIG = {
     host: '10.1.1.1',
     port: 22,
     username: 'YOUR_USERNAME',  // Replace with your username
     password: 'YOUR_PASSWORD'   // Replace with your password
   };
   ```

## Usage

### Starting the Application

```bash
npm start
```

### Connection Flow

1. Click "Connect to MedSolution" button
2. The application will automatically:
   - Connect to the SSH server
   - Elevate privileges with `sudo -s`
   - Source MedSolution environment (`. msver`)
   - Navigate to MedSolution directory
   - Launch the MedSolution application (`msgo`)
3. Once automation completes, you'll have full terminal control

### Keyboard Shortcuts

- **F2** - Send save command to MedSolution
- **F10** - Send exit command to MedSolution

### Quick Actions

- **F2 Save** - Triggers the save function in MedSolution
- **F10 Exit** - Triggers the exit function in MedSolution
- **Restart Session** - Disconnects and returns to the dashboard

## Project Structure

```
medsolution-launcher/
├── main.js              # Electron main process & SSH automation
├── preload.js           # Secure context bridge
├── renderer.js          # Terminal UI & event handlers
├── index.html           # Application UI
├── styles.css           # Modern dark theme
├── package.json         # Dependencies & scripts
└── README.md           # This file
```

## Automation Sequence

The application automates the following login sequence:

1. **SSH Connect** → Connect to 10.1.1.1:22
2. **Wait for `$`** → Send `sudo -s`
3. **Wait for password** → Send password
4. **Wait for `#`** → Send `. msver`
5. **Wait for `#`** → Send `cd /usr1/medsol/kapos`
6. **Wait for `#`** → Send `msgo`
7. **Hand over control** → User can interact with MedSolution

## Security Notes

⚠️ **Important**: This application stores credentials in plain text. For production use:

- Use environment variables for credentials
- Implement secure credential storage
- Use SSH key-based authentication instead of passwords
- Restrict file permissions on the application directory

## Troubleshooting

### Connection Issues

- Verify SSH server is reachable: `ping 10.1.1.1`
- Check credentials are correct
- Ensure firewall allows SSH connections
- Verify network connectivity

### Terminal Display Issues

- Try resizing the window
- Click "Restart Session" to reset
- Check console for errors (View → Toggle Developer Tools)

### Automation Not Working

- Check the automation sequence in `main.js`
- Verify prompt detection patterns match your server
- Enable debug mode: `npm run dev`

## Development

### Debug Mode

Run with developer tools open:
```bash
npm run dev
```

### Building for Production

To package the application for distribution:

1. Install electron-builder:
```bash
npm install --save-dev electron-builder
```

2. Add to package.json:
```json
"scripts": {
  "build": "electron-builder"
},
"build": {
  "appId": "com.medsolution.launcher",
  "productName": "MedSolution Launcher",
  "directories": {
    "output": "dist"
  },
  "mac": {
    "category": "public.app-category.utilities"
  },
  "win": {
    "target": "nsis"
  },
  "linux": {
    "target": "AppImage"
  }
}
```

3. Build:
```bash
npm run build
```

## Customization

### Changing the Theme

Edit `styles.css` to customize colors, fonts, and layout.

### Modifying Automation

Edit the automation sequence in `main.js` under the `connect-ssh` IPC handler.

### Adding Features

- **main.js** - Add new IPC handlers
- **preload.js** - Expose new APIs to renderer
- **renderer.js** - Implement UI logic
- **index.html** - Add UI elements

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Check the troubleshooting section
- Review the code comments in main.js
- Open an issue in the project repository

## Version History

### 1.0.0 (Initial Release)
- Automated SSH connection and login
- Modern dark UI theme
- xterm.js terminal integration
- Quick action buttons
- Session management

---

Built with ❤️ for MedSolution users
