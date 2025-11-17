# DagDev v1.0.0 - Installation Guide

## 📦 Standalone Executables (No Node.js Required!)

Download the appropriate executable for your operating system:

### Linux
```bash
# Download
wget https://github.com/virtualconnekt/dag-dev/releases/download/v1.0.0/dagdev-linux

# Make executable
chmod +x dagdev-linux

# Move to PATH (optional)
sudo mv dagdev-linux /usr/local/bin/dagdev

# Verify installation
dagdev --version
```

### macOS
```bash
# Download
curl -L https://github.com/virtualconnekt/dag-dev/releases/download/v1.0.0/dagdev-macos -o dagdev-macos

# Make executable
chmod +x dagdev-macos

# Move to PATH (optional)
sudo mv dagdev-macos /usr/local/bin/dagdev

# Verify installation
dagdev --version
```

### Windows
```powershell
# Download dagdev-win.exe from GitHub releases
# https://github.com/virtualconnekt/dag-dev/releases/download/v1.0.0/dagdev-win.exe

# Add to PATH or run directly
.\dagdev-win.exe --version
```

## 🚀 Quick Start

After installation:

```bash
# 1. Create a new project
dagdev init my-blockchain-app
cd my-blockchain-app

# 2. Start local blockchain
dagdev node

# 3. In another terminal, compile contracts
dagdev compile

# 4. Deploy contracts
dagdev run scripts/deploy.js

# 5. Run tests
dagdev test
```

## 📊 File Sizes

- **Linux**: ~70 MB
- **macOS**: ~75 MB  
- **Windows**: ~62 MB

## 🔐 Verify Downloads (SHA256)

```
a6f5faa74b3d10d6f60e750fc6f82c0fc04da4d312c0245e8d4c9a49eb3f05c7  dagdev-linux
d4ab7ddc6595fe01e17e8e56aee951fa2035d7e9ae2c2d49444589bdd7029311  dagdev-macos
5ae44983626a149645190fa0d46daabb7deaebdce7c94eb1a94b1b7e834df722  dagdev-win.exe
```

Verify with:
```bash
sha256sum dagdev-linux  # Linux
shasum -a 256 dagdev-macos  # macOS
certutil -hashfile dagdev-win.exe SHA256  # Windows
```

## 🆘 Troubleshooting

### Permission Denied (Linux/macOS)
```bash
chmod +x dagdev-linux
# or
chmod +x dagdev-macos
```

### Command Not Found
Make sure the executable is in your PATH or use the full path:
```bash
./dagdev-linux --help
```

### macOS "Cannot be opened because it is from an unidentified developer"
```bash
xattr -d com.apple.quarantine dagdev-macos
```

## 📚 Documentation

- GitHub: https://github.com/virtualconnekt/dag-dev
- Issues: https://github.com/virtualconnekt/dag-dev/issues

## 💡 Alternative Installation (with Node.js)

If you have Node.js installed:
```bash
npm install -g dagdev
```

---

**Need help?** Open an issue on GitHub: https://github.com/virtualconnekt/dag-dev/issues
