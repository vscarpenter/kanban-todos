# User Guide

Complete guide to using all features of the Kanban Todos application.

## 📋 Table of Contents

- [Board Management](#board-management)
- [Task Management](#task-management)
- [Search and Filtering](#search-and-filtering)
- [Data Management](#data-management)
- [Settings and Preferences](#settings-and-preferences)
- [Accessibility Features](#accessibility-features)
- [Performance Monitoring](#performance-monitoring)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Mobile Usage](#mobile-usage)
- [FAQ](#faq)

## 🏗️ Board Management

### Creating Boards

1. **From Sidebar**
   - Click the **"+"** button in the sidebar
   - Enter a descriptive name
   - Click **"Create Board"**

2. **From Menu**
   - Click the menu button (☰) in the top-left
   - Select **"New Board"**
   - Follow the same process

### Managing Boards

**Rename a Board:**
1. Right-click on the board name in the sidebar
2. Select **"Rename"**
3. Enter the new name
4. Press Enter to confirm

**Delete a Board:**
1. Right-click on the board name
2. Select **"Delete Board"**
3. Confirm the deletion in the dialog

**Switch Between Boards:**
- Click on any board name in the sidebar
- The board will load instantly with all your tasks

### Column Management

**Add a Column:**
1. Click the **"+"** button at the end of the board
2. Enter a column name (e.g., "In Review", "Testing")
3. Click **"Add Column"**

**Rename a Column:**
1. Double-click on the column header
2. Enter the new name
3. Press Enter to confirm

**Reorder Columns:**
1. Click and hold the column header
2. Drag to the desired position
3. Release to drop

**Delete a Column:**
1. Right-click on the column header
2. Select **"Delete Column"**
3. Confirm deletion (tasks will be moved to "To Do")

## ✅ Task Management

### Creating Tasks

**Quick Create:**
1. Click **"Add Task"** in any column
2. Enter a title
3. Press Enter to create

**Detailed Create:**
1. Click **"Add Task"** in any column
2. Fill in the task form:
   - **Title**: Required, brief description
   - **Description**: Optional, detailed information
   - **Priority**: High, Medium, or Low
   - **Due Date**: Optional, click calendar icon
   - **Assignee**: Optional, type name or email
   - **Tags**: Optional, comma-separated
3. Click **"Create Task"**

### Editing Tasks

**Quick Edit:**
1. Click on the task title
2. Type the new title
3. Press Enter to save

**Full Edit:**
1. Click on the task card
2. Modify any field in the edit dialog
3. Click **"Save Changes"**

### Task Actions

**Move Tasks:**
- **Drag and drop** between columns
- **Right-click** → "Move to..." → Select column

**Duplicate Tasks:**
1. Right-click on task
2. Select **"Duplicate"**
3. Edit the duplicated task as needed

**Delete Tasks:**
1. Right-click on task
2. Select **"Delete Task"**
3. Confirm deletion

**Archive Tasks:**
1. Right-click on task
2. Select **"Archive"**
3. Task moves to archived state

### Task Properties

**Priority Levels:**
- 🔴 **High**: Urgent tasks requiring immediate attention
- 🟡 **Medium**: Important tasks with normal priority
- 🟢 **Low**: Nice-to-have tasks

**Due Dates:**
- Click calendar icon to set due date
- Overdue tasks are highlighted in red
- Due today tasks show orange warning

**Tags:**
- Add multiple tags separated by commas
- Use consistent naming (e.g., "bug", "feature", "urgent")
- Click tags to filter tasks

## 🔍 Search and Filtering

### Search Tasks

**Basic Search:**
1. Click in the search bar at the top
2. Type your search term
3. Results appear instantly as you type

**Advanced Search:**
- **By Title**: `title:important`
- **By Description**: `desc:meeting`
- **By Priority**: `priority:high`
- **By Assignee**: `assignee:john`
- **By Tags**: `tag:bug`
- **By Due Date**: `due:today`, `due:this-week`

**Search Operators:**
- **AND**: `bug AND urgent` (both terms)
- **OR**: `bug OR feature` (either term)
- **NOT**: `bug NOT urgent` (exclude urgent bugs)
- **Quotes**: `"exact phrase"` (exact match)

### Filtering Tasks

**Filter by Priority:**
1. Click the filter icon in the search bar
2. Select priority level(s)
3. Click **"Apply Filter"**

**Filter by Due Date:**
1. Click the filter icon
2. Select date range
3. Click **"Apply Filter"**

**Filter by Assignee:**
1. Click the filter icon
2. Select assignee(s)
3. Click **"Apply Filter"**

**Clear Filters:**
- Click **"Clear All"** in the filter panel
- Or click the **"×"** next to active filters

## 💾 Data Management

### Exporting Data

**Export Single Board:**
1. Click the board menu (⋮) in the sidebar
2. Select **"Export Board"**
3. Choose format (JSON, CSV, or PDF)
4. Click **"Download"**

**Export All Data:**
1. Go to Settings → Data Management
2. Click **"Export All Data"**
3. Choose format and click **"Download"**

**Scheduled Exports:**
1. Go to Settings → Data Management
2. Enable **"Auto Export"**
3. Set frequency (daily, weekly, monthly)
4. Choose export location

### Importing Data

**Import from File:**
1. Go to Settings → Data Management
2. Click **"Import Data"**
3. Select your file (JSON or CSV)
4. Choose import options:
   - **Replace existing data**
   - **Merge with existing data**
   - **Create new board**
5. Click **"Import"**

**Import from URL:**
1. Go to Settings → Data Management
2. Click **"Import from URL"**
3. Enter the data URL
4. Click **"Import"**

### Data Backup

**Automatic Backup:**
- Data is automatically saved to browser storage
- Backup occurs every 5 minutes
- Last 10 backups are kept

**Manual Backup:**
1. Go to Settings → Data Management
2. Click **"Create Backup"**
3. Enter backup name
4. Click **"Save Backup"**

**Restore from Backup:**
1. Go to Settings → Data Management
2. Click **"Restore Backup"**
3. Select backup to restore
4. Confirm restoration

## ⚙️ Settings and Preferences

### General Settings

**Theme:**
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Easy on the eyes
- **Auto**: Follows system preference

**Language:**
- English (default)
- Spanish
- French
- German
- More languages coming soon

**Date Format:**
- MM/DD/YYYY (US)
- DD/MM/YYYY (European)
- YYYY-MM-DD (ISO)

### Notification Settings

**Task Reminders:**
- **Due Date Alerts**: Get notified when tasks are due
- **Overdue Warnings**: Alerts for overdue tasks
- **Daily Summary**: Daily task summary email

**Browser Notifications:**
- Enable/disable browser notifications
- Customize notification sounds
- Set quiet hours

### Performance Settings

**Auto-save:**
- **Enabled**: Save changes automatically
- **Disabled**: Manual save only
- **Interval**: Set auto-save frequency

**Data Retention:**
- **Keep all data**: Never delete old data
- **Auto-cleanup**: Remove old completed tasks
- **Archive old data**: Move old data to archive

## ♿ Accessibility Features

### Screen Reader Support

**Navigation:**
- Use Tab to navigate between elements
- Use Enter/Space to activate buttons
- Use Arrow keys to navigate lists

**Announcements:**
- Task changes are announced
- Board switches are announced
- Search results are announced

### Visual Accessibility

**High Contrast Mode:**
1. Go to Settings → Accessibility
2. Enable **"High Contrast"**
3. Interface uses high contrast colors

**Font Size:**
1. Go to Settings → Accessibility
2. Select font size:
   - Small (default)
   - Medium
   - Large
   - Extra Large

**Reduced Motion:**
1. Go to Settings → Accessibility
2. Enable **"Reduce Motion"**
3. Animations are minimized

### Keyboard Navigation

**Skip Links:**
- Press Tab to access skip links
- Skip to main content
- Skip to navigation

**Focus Management:**
- Clear focus indicators
- Logical tab order
- Focus trapping in dialogs

## 📊 Performance Monitoring

### Real-time Monitoring

**Performance Dashboard:**
1. Click the performance icon in the sidebar
2. View real-time metrics:
   - Memory usage
   - Operation timing
   - Slow operations

**Memory Usage:**
- Current memory consumption
- Memory trends over time
- Memory warnings

**Operation Timing:**
- Task creation time
- Search response time
- Board load time

### Performance Optimization

**Clear Cache:**
1. Go to Performance Dashboard
2. Click **"Clear Cache"**
3. Confirm cache clearing

**Optimize Data:**
1. Go to Settings → Performance
2. Click **"Optimize Data"**
3. Wait for optimization to complete

## ⌨️ Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | Create new task |
| `Ctrl/Cmd + B` | Create new board |
| `Ctrl/Cmd + F` | Focus search bar |
| `Ctrl/Cmd + S` | Save current board |
| `Ctrl/Cmd + E` | Export data |
| `Ctrl/Cmd + I` | Import data |
| `Ctrl/Cmd + ,` | Open settings |
| `Escape` | Close dialogs |

### Navigation Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Next element |
| `Shift + Tab` | Previous element |
| `Enter` | Activate button/link |
| `Space` | Toggle checkbox |
| `Arrow Keys` | Navigate lists |

### Task Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Save task |
| `Escape` | Cancel task edit |
| `Delete` | Delete selected task |
| `Ctrl/Cmd + D` | Duplicate task |

## 📱 Mobile Usage

### Touch Gestures

**Drag and Drop:**
1. Long press on task card
2. Drag to desired column
3. Release to drop

**Swipe Actions:**
- **Swipe right**: Mark as complete
- **Swipe left**: Delete task
- **Swipe up**: Show task details

**Pinch to Zoom:**
- Pinch to zoom in/out
- Double tap to reset zoom

### Mobile Layout

**Responsive Design:**
- Automatically adapts to screen size
- Touch-friendly buttons and controls
- Optimized for one-handed use

**Mobile Menu:**
- Hamburger menu for navigation
- Swipe from left to open sidebar
- Swipe from right to close

## ❓ FAQ

### General Questions

**Q: Is my data safe?**
A: Yes! All data is stored locally in your browser. Nothing is sent to external servers.

**Q: Can I use this offline?**
A: Absolutely! The app works completely offline once loaded.

**Q: How many boards can I create?**
A: There's no limit! Create as many boards as you need.

**Q: Can I share boards with others?**
A: Currently, boards are private. Sharing features are planned for future releases.

### Technical Questions

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions).

**Q: Can I use this on mobile?**
A: Yes! The app is fully responsive and works great on mobile devices.

**Q: How do I backup my data?**
A: Use the Export feature in Settings → Data Management.

**Q: What if I lose my data?**
A: Check your browser's local storage or restore from a backup.

### Troubleshooting

**Q: The app is slow?**
A: Try clearing the cache in the Performance Dashboard.

**Q: Tasks won't drag and drop?**
A: Make sure you're clicking and holding the task card, not the text.

**Q: Search not working?**
A: Try refreshing the page or clearing your browser cache.

**Q: Can't see my boards?**
A: Check if you're logged in to the correct account.

---

*Need more help? Check the [Troubleshooting Guide](./troubleshooting.md) or [Contact Support](../README.md#support).*
