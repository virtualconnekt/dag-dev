# DagDev v1.0.0 - Download Links

Due to GitHub's file size limitations, the standalone executables are hosted on Google Drive.

## 📥 Download Executables

### Linux (70 MB)
**Google Drive:** [REPLACE_WITH_YOUR_GOOGLE_DRIVE_LINK]

**Direct download:**
```bash
# Method 1: Using wget
wget "YOUR_GOOGLE_DRIVE_LINK_HERE" -O dagdev-linux
chmod +x dagdev-linux
sudo mv dagdev-linux /usr/local/bin/dagdev

# Method 2: Using curl
curl -L "YOUR_GOOGLE_DRIVE_LINK_HERE" -o dagdev-linux
chmod +x dagdev-linux
sudo mv dagdev-linux /usr/local/bin/dagdev
```

**SHA256 Checksum:**
```
a6f5faa74b3d10d6f60e750fc6f82c0fc04da4d312c0245e8d4c9a49eb3f05c7
```

---

### macOS (75 MB)
**Google Drive:** [REPLACE_WITH_YOUR_GOOGLE_DRIVE_LINK]

**Direct download:**
```bash
# Method 1: Using curl
curl -L "YOUR_GOOGLE_DRIVE_LINK_HERE" -o dagdev-macos
chmod +x dagdev-macos
sudo mv dagdev-macos /usr/local/bin/dagdev

# Method 2: Using wget (if installed)
wget "YOUR_GOOGLE_DRIVE_LINK_HERE" -O dagdev-macos
chmod +x dagdev-macos
sudo mv dagdev-macos /usr/local/bin/dagdev
```

**SHA256 Checksum:**
```
d4ab7ddc6595fe01e17e8e56aee951fa2035d7e9ae2c2d49444589bdd7029311
```

**macOS Security Note:**
If you get "cannot be opened because it is from an unidentified developer":
```bash
xattr -d com.apple.quarantine dagdev-macos
```

---

### Windows (62 MB)
**Google Drive:** [REPLACE_WITH_YOUR_GOOGLE_DRIVE_LINK]

**Installation:**
1. Download `dagdev-win.exe` from the link above
2. Save it to a folder (e.g., `C:\Program Files\DagDev\`)
3. Add that folder to your system PATH
4. Open Command Prompt and run: `dagdev --version`

**SHA256 Checksum:**
```
5ae44983626a149645190fa0d46daabb7deaebdce7c94eb1a94b1b7e834df722
```

---

## ✅ Verify Your Download

After downloading, verify the file integrity:

### Linux/macOS:
```bash
sha256sum dagdev-linux    # Linux
shasum -a 256 dagdev-macos # macOS
```

### Windows (PowerShell):
```powershell
certutil -hashfile dagdev-win.exe SHA256
```

Compare the output with the checksums above.

---

## 📋 How to Upload to Google Drive (For Maintainers)

1. Go to [Google Drive](https://drive.google.com)
2. Create a folder: "DagDev v1.0.0"
3. Upload the three executables:
   - `dagdev-linux`
   - `dagdev-macos`
   - `dagdev-win.exe`
4. Right-click each file → "Get link" → "Anyone with the link"
5. Copy the shareable links
6. Update this file with the actual links

**Tip:** For direct downloads (without Google Drive preview page), convert the link:
```
Original: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
Direct:   https://drive.google.com/uc?export=download&id=FILE_ID
```

---

## 🔄 Alternative: Use GitHub Releases (Smaller Files)

The following files ARE available in GitHub Releases:
- ✅ `INSTALL.md` - Installation guide
- ✅ `RELEASE_NOTES.md` - Release notes
- ✅ `SHA256SUMS.txt` - Checksums

Visit: https://github.com/virtualconnekt/dag-dev/releases/tag/v1.0.0

---

## 💡 Alternative Installation Methods

### Using npm (Recommended for developers):
```bash
npm install -g dagdev
```

### From source:
```bash
git clone https://github.com/virtualconnekt/dag-dev.git
cd dag-dev
npm install
cd cli && npm run build && npm link
```

---

**Need help?** Open an issue: https://github.com/virtualconnekt/dag-dev/issues
