<img src="src/assets/img/icon-128.png" width="64"/>

# Voyagr VPN Chrome Extension (MV3)

## Description

This is a modern Chrome Extension that serves as the client for the Voyagr VPN service.
It is built using the latest Chrome Extension Manifest V3 (MV3) standards and is designed to be fast, efficient, and user-friendly.

The extension allows users to easily connect to the Voyagr VPN service, manage their regions, and access the internet securely and privately.

Created using the wonderful [Samuel Simões' boilerplate](https://github.com/samuelsimoes/chrome-extension-webpack-boilerplate)

## Technical Implementation

### Setup and Installation (Local Development)

1. Requires [Node.js](https://nodejs.org/) version >= **18**
2. Clone this repository
3. Run `npm install` followed by `npm start`
4. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked extension"
   - Select the `build` folder

### Project Structure

All extension code must be placed in the `src` folder.

- Popup interface
- Options page (implemented with TypeScript)
- Background script

### Build from Source

Create a production build with:

```
$ NODE_ENV=production npm run build
```

The `build` folder will contain the extension ready for Chrome Web Store submission.
The `zip` folder will contain a zipped version of the extension.

### Installation on Chrome

1. Go to the github releases page and download the latest release zip.
2. Unzip the downloaded file.
3. Open Chrome and navigate to `chrome://extensions/`.
4. Enable "Developer mode" in the top right corner.
5. Click "Load unpacked" and select the unzipped extension folder.
