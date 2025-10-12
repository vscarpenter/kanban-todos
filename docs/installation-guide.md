# Installing Cascade as a Progressive Web App (PWA)

Cascade can be installed on your device for quick access and offline use. Once installed, it works like a native app with its own icon and window.

## Why Install Cascade?

- **Quick Access**: Launch from your home screen, dock, or start menu
- **Offline Support**: Access your tasks even without an internet connection
- **Native Experience**: Runs in its own window without browser UI
- **Better Performance**: Optimized startup and faster load times
- **App Shortcuts**: Quick actions from your home screen/dock

## Installation Instructions by Platform

### Desktop (Windows, macOS, Linux)

#### Chrome, Edge, or Brave

1. **Open Cascade** in Chrome, Edge, or Brave browser
2. **Look for the install icon** in the address bar (it looks like a computer monitor with a download arrow)
3. **Click the install icon** or use the browser menu:
   - Chrome: Menu (⋮) → "Install Cascade..."
   - Edge: Menu (⋯) → "Apps" → "Install Cascade"
4. **Click "Install"** in the popup dialog
5. **Launch the app** from:
   - Windows: Start Menu or Desktop shortcut
   - macOS: Applications folder or Launchpad
   - Linux: Applications menu

**Alternative for Chrome/Edge:**
- Press `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (macOS) to open the install dialog

#### Firefox

Firefox doesn't support automatic PWA installation prompts, but you can still use Cascade:

1. **Bookmark the page** for quick access
2. **Pin the tab** to keep it easily accessible
3. Consider using Chrome or Edge for the full PWA experience

#### Safari (macOS)

Safari on macOS has limited PWA support:

1. **Open Cascade** in Safari
2. **Add to Dock**: File → "Add to Dock" (if available)
3. For better experience, consider using Chrome or Edge

### iOS (iPhone and iPad)

#### Safari (Required for iOS)

1. **Open Cascade** in Safari browser
2. **Tap the Share button** (the square with an arrow pointing up) at the bottom of the screen
3. **Scroll down** and tap **"Add to Home Screen"**
4. **Edit the name** if desired (default: "Cascade")
5. **Tap "Add"** in the top-right corner
6. **Find the app** on your home screen with the Cascade icon

**Tips for iOS:**
- The app must be opened in Safari (not Chrome or Firefox on iOS)
- Once installed, it will open in its own window without Safari UI
- You can move the icon to any home screen or folder

### Android

#### Chrome (Recommended)

**Method 1: Install Banner**
1. **Open Cascade** in Chrome browser
2. **Wait for the install banner** to appear at the bottom of the screen
3. **Tap "Install"** on the banner
4. **Confirm installation** in the dialog
5. **Find the app** in your app drawer

**Method 2: Browser Menu**
1. **Open Cascade** in Chrome
2. **Tap the menu** (⋮) in the top-right corner
3. **Select "Install app"** or "Add to Home screen"
4. **Tap "Install"** in the dialog
5. **Find the app** in your app drawer or home screen

**Tips for Android:**
- Chrome is the recommended browser for the best PWA experience
- The app will appear in your app drawer like any other app
- You can uninstall it like a regular app from Settings

#### Firefox (Android)

1. **Open Cascade** in Firefox
2. **Tap the menu** (⋮) in the top-right
3. **Select "Install"** or "Add to Home screen"
4. **Tap "Add"** to confirm
5. **Find the app** on your home screen

#### Samsung Internet

1. **Open Cascade** in Samsung Internet
2. **Tap the menu** (≡) at the bottom
3. **Select "Add page to"** → "Home screen"
4. **Tap "Add"** to confirm
5. **Find the app** on your home screen

## Verifying Installation

After installation, you can verify Cascade is working as a PWA:

1. **Launch the app** from your device
2. **Check the window/app**: It should open in its own window without browser UI
3. **Test offline**: Close your internet connection and verify the app still works
4. **Check the icon**: You should see the Cascade icon in your app list

## Updating the Installed App

Cascade automatically checks for updates when you're online:

1. **Automatic Updates**: The app will detect new versions when available
2. **Update Notification**: You'll see a notification when an update is ready
3. **Apply Update**: Click "Reload" in the update notification to apply
4. **Manual Check**: Refresh the app while online to check for updates

## Uninstalling the App

### Desktop

**Chrome/Edge:**
1. **Open the app** or go to chrome://apps (Chrome) or edge://apps (Edge)
2. **Right-click on Cascade** icon
3. **Select "Uninstall"** or "Remove from Chrome/Edge"
4. **Confirm removal**

**Alternative:**
- Windows: Settings → Apps → Find "Cascade" → Uninstall
- macOS: Drag app from Applications to Trash
- Linux: Remove from Applications menu

### iOS

1. **Long press the Cascade icon** on your home screen
2. **Tap "Remove App"**
3. **Select "Delete App"**
4. **Confirm deletion**

### Android

**Method 1: Standard Uninstall**
1. **Long press the Cascade icon** in your app drawer
2. **Drag to "Uninstall"** or tap the info icon
3. **Tap "Uninstall"** and confirm

**Method 2: Settings**
1. **Go to Settings** → Apps
2. **Find "Cascade"** in the app list
3. **Tap "Uninstall"** and confirm

## Troubleshooting

### Install Button Not Appearing (Desktop)

**Possible Causes:**
- Already installed (check your apps/start menu)
- Not using a supported browser (use Chrome or Edge)
- Page hasn't finished loading (wait a few seconds)
- Browser cache issue (try clearing cache or incognito mode)

**Solutions:**
1. Check if already installed
2. Use Chrome or Edge browser
3. Clear browser cache and reload
4. Try incognito/private browsing mode

### "Add to Home Screen" Not Available (iOS)

**Possible Causes:**
- Not using Safari browser
- Using Safari in private browsing mode
- iOS restrictions or device management

**Solutions:**
1. Open the app in Safari (not Chrome or Firefox)
2. Disable private browsing mode
3. Check Screen Time restrictions

### App Won't Launch After Installation

**Solutions:**
1. Restart your device
2. Uninstall and reinstall the app
3. Clear browser cache before reinstalling
4. Make sure you have a stable internet connection for first launch

### App Doesn't Work Offline

**Possible Causes:**
- First launch not completed online
- Service worker not registered
- Browser storage disabled

**Solutions:**
1. Open the app while online at least once
2. Check browser settings allow storage
3. Reinstall the app if problem persists

### Update Notification Won't Go Away

**Solutions:**
1. Click "Reload" to apply the update
2. Force refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
3. Clear browser cache and reload

## Getting Help

If you encounter issues installing Cascade:

1. Check this guide for troubleshooting tips
2. Try using a different browser (Chrome or Edge recommended)
3. Make sure your browser is up to date
4. Check the [User Guide](./user-guide.md) for general app help
5. Report issues on [GitHub](https://github.com/vscarpenter/kanban-todos/issues)

## Benefits of Installing vs. Using in Browser

| Feature | Installed App | Browser Version |
|---------|--------------|-----------------|
| Launch Speed | ⚡ Faster | Standard |
| Offline Access | ✅ Full support | ⚠️ Limited |
| App Icon | ✅ Yes | ❌ No |
| Own Window | ✅ Yes | ❌ Browser tabs |
| Push Notifications | ✅ Possible | ⚠️ Limited |
| Storage Space | Higher | Lower |
| Updates | Automatic | Manual refresh |

## Privacy & Data

Installing Cascade as a PWA:

- **No additional data collection**: Same privacy as browser version
- **Local storage only**: All data stays on your device
- **No tracking**: No external analytics or tracking
- **Secure**: Uses same security as HTTPS websites

---

*Ready to start using Cascade? [Return to the app](/) or check the [User Guide](./user-guide.md) for feature documentation.*
