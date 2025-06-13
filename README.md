# Maraikka

A beautiful, secure desktop application for encrypting and decrypting files and directories with an intuitive file explorer interface.

![Maraikka](https://img.shields.io/badge/Electron-App-blue)
![Security](https://img.shields.io/badge/AES-Encryption-green)
![Platform](https://img.shields.io/badge/Platform-Cross--Platform-lightgray)

## Features

- 🔒 **Secure AES Encryption** - Military-grade encryption for your sensitive files
- 📁 **Directory Encryption** - Encrypt entire directories with a single password
- 🎯 **Individual File Encryption** - Encrypt specific files independently
- 🎨 **Beautiful Dark UI** - Modern, responsive interface with smooth animations
- 📊 **File Statistics** - Track encrypted vs unencrypted files
- 🔍 **Built-in File Explorer** - Browse and manage files without leaving the app
- 💪 **Password Strength Indicator** - Real-time password security feedback
- 🔔 **Smart Notifications** - Get informed about all operations
- 🚀 **Cross-Platform** - Works on Windows, macOS, and Linux
- ⚡ **Fast Performance** - Optimized for large directories and files

## Screenshots

### Main Interface
The app features a clean, dark interface with a sidebar for actions and statistics, and a main file explorer area.

### Password Security
Built-in password strength meter helps you create secure passwords for your encrypted files.

## Installation

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Quick Start

1. **Clone or download the project**
   ```bash
   cd maraikka-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

### Building for Production

To create distributable packages for your platform:

```bash
# Build for current platform
npm run build

# Build for Windows
npm run build-win

# Build for macOS
npm run build-mac

# Build for Linux
npm run build-linux
```

Built applications will be available in the `dist` directory.

## Usage

### Getting Started

1. **Launch the Application**
   - Double-click the Maraikka icon
   - The application will open with an empty file explorer

2. **Select a Directory**
   - Click "Select Directory" in the header or sidebar
   - Choose the folder containing files you want to encrypt/decrypt
   - The file explorer will display all contents

### Directory Operations

#### Encrypting a Directory
1. Select a directory containing your files
2. Click the "Encrypt Directory" button in the sidebar
3. Enter a strong password in the modal dialog
4. Confirm the operation
5. All files in the directory will be encrypted with `.enc` extension

#### Decrypting a Directory
1. Select a directory containing encrypted files (`.enc` files)
2. Click the "Decrypt Directory" button in the sidebar
3. Enter the same password used for encryption
4. Confirm the operation
5. All encrypted files will be restored to their original format

### Individual File Operations

#### Encrypting Single Files
1. Hover over any unencrypted file in the file list
2. Click the "Encrypt" button that appears
3. Enter a password for this specific file
4. The file will be encrypted and marked with a lock icon

#### Decrypting Single Files
1. Hover over any encrypted file (shown with lock icon)
2. Click the "Decrypt" button that appears
3. Enter the password used to encrypt the file
4. The file will be decrypted and restored

### Security Features

#### Password Strength
- The app includes a real-time password strength meter
- Passwords are evaluated for:
  - Length (minimum 6 characters recommended)
  - Uppercase letters
  - Lowercase letters
  - Numbers
  - Special characters

#### Encryption Details
- Uses AES (Advanced Encryption Standard) encryption
- Files are converted to Base64 before encryption for binary safety
- Original files are securely deleted after encryption
- Encrypted files use `.enc` extension for easy identification

## File Management

### File Explorer Features
- **List View**: Detailed file information with sizes and dates
- **File Statistics**: Real-time count of files, directories, and encrypted items
- **Visual Indicators**: Different colors and icons for directories, files, and encrypted items
- **Hover Actions**: Encrypt/decrypt buttons appear on file hover
- **Progress Tracking**: Visual progress bars for operations
- **Smart Notifications**: Success/error notifications for all operations

### Supported File Types
- All file types are supported for encryption
- Binary files (images, videos, executables) are handled safely
- Text files maintain integrity after decryption
- Directory structures are preserved

## Security Considerations

### Best Practices
1. **Use Strong Passwords**: Combine uppercase, lowercase, numbers, and symbols
2. **Remember Your Passwords**: Lost passwords cannot be recovered
3. **Backup Important Files**: Keep unencrypted copies in secure locations
4. **Test Decryption**: Verify files decrypt correctly before deleting originals

### Security Notes
- Passwords are never stored or logged
- Each encryption operation uses the provided password as the key
- Files are processed locally - no data leaves your computer
- Original files are securely deleted after successful encryption

## Troubleshooting

### Common Issues

**App won't start**
- Ensure Node.js is installed (version 16+)
- Run `npm install` to install dependencies
- Check for any error messages in the terminal

**Encryption/Decryption fails**
- Verify the password is correct
- Ensure you have write permissions to the directory
- Check available disk space
- Close any programs that might be using the files

**Files appear corrupted after decryption**
- This usually indicates an incorrect password was used
- Try the decryption again with the correct password
- Check if the `.enc` file is corrupted

### Performance Tips
- For large directories, encryption/decryption may take time
- Close other applications to free up system resources
- Avoid interrupting the process once started

## Development

### Project Structure
```
maraikka-app/
├── src/
│   ├── main.js              # Main Electron process
│   ├── preload.js           # Secure IPC bridge
│   └── renderer/
│       ├── index.html       # Main UI
│       ├── styles.css       # Application styles
│       └── renderer.js      # UI logic and interactions
├── package.json             # Dependencies and scripts
└── README.md               # Documentation
```

### Technologies Used
- **Electron**: Cross-platform desktop framework
- **Node.js**: Backend runtime
- **Crypto-JS**: Encryption library
- **fs-extra**: Enhanced file system operations
- **HTML/CSS/JavaScript**: Frontend technologies

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or suggestions:
1. Check the troubleshooting section above
2. Review existing issues in the project repository
3. Create a new issue with detailed information about your problem

---

**Made with ❤️ for secure file management** 