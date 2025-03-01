# Browser Sticky Notes - Code Documentation

This document provides a comprehensive overview of the Browser Sticky Notes extension codebase, explaining the architecture, components, and how they interact with each other.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
   - [Manifest](#manifest)
   - [Popup Interface](#popup-interface)
   - [Background Service](#background-service)
   - [Table Functionality](#table-functionality)
   - [Options Page](#options-page)
   - [Styling](#styling)
4. [Data Flow](#data-flow)
5. [Key Features Implementation](#key-features-implementation)
   - [Multi-Note System](#multi-note-system)
   - [Text Formatting](#text-formatting)
   - [Table Mode](#table-mode)
   - [Context Menu Integration](#context-menu-integration)
   - [Theme Support](#theme-support)
6. [Storage Management](#storage-management)
7. [Event Handling](#event-handling)

## Overview

Browser Sticky Notes is a browser extension that provides a convenient way to create, edit, and manage notes directly in the browser. It supports multiple notes, text formatting, a table mode for structured data, and customizable appearance settings.

## Architecture

The extension follows a standard browser extension architecture with these main components:

1. **Popup Interface**: The main user interface that appears when clicking the extension icon
2. **Background Service**: Handles background processes and context menu integration
3. **Options Page**: Provides customization settings for the extension
4. **Storage System**: Uses Chrome's storage API to persist notes and settings

## Core Components

### Manifest

The `manifest.json` file defines the extension's configuration, permissions, and entry points:

```json
{
  "manifest_version": 3,
  "name": "Browser Sticky Notes",
  "version": "4.3",
  "description": "Opens a Sticky note on the Page when invoked using Shift+ALT+N.",
  "action": {
    "default_popup": "popup.html"
  },
  "permissions": [
    "storage",
    "contextMenus",
    "notifications"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "options_page": "options.html",
  "commands": {
    "open_popup": {
      "suggested_key": {
        "default": "Shift+Alt+N"
      },
      "description": "Opens the popup"
    }
  }
}
```

Key aspects:
- Uses Manifest V3
- Defines keyboard shortcut (Shift+Alt+N)
- Requests permissions for storage, context menus, and notifications
- Specifies background service worker, popup, and options page

### Popup Interface

The popup interface (`popup.html` and `popup.js`) provides the main user interaction point:

#### HTML Structure (`popup.html`)

The popup interface consists of:
- Header with title and settings icon
- Tab navigation for multiple notes
- Toggle for table mode
- Editable content area
- Spreadsheet container (for table mode)
- Styling buttons for text formatting
- Word count display
- Export button

#### JavaScript Logic (`popup.js`)

The `popup.js` file handles:
1. **Initialization**:
   - Loads user settings and preferences
   - Sets up event listeners
   - Configures the interface based on saved settings

2. **Note Management**:
   - Handles tab switching between notes
   - Loads and saves note content
   - Manages single note vs. multi-note modes

3. **Text Formatting**:
   - Implements bold, italic, and underline functionality
   - Provides date insertion
   - Tracks and displays word count

4. **Table Mode Integration**:
   - Toggles between text and table modes
   - Coordinates with table.js for spreadsheet functionality

5. **UI Customization**:
   - Applies theme settings (light/dark mode)
   - Adjusts font sizes and colors based on user preferences

6. **Export Functionality**:
   - Provides text export capability

### Background Service

The `background.js` file runs in the background and handles:

1. **Context Menu Integration**:
   - Creates and manages context menu items
   - Handles adding selected text to notes

2. **Keyboard Shortcut Handling**:
   - Listens for the Shift+Alt+N shortcut to open the popup

3. **Notification Management**:
   - Shows notifications when text is added via context menu

4. **Message Passing**:
   - Communicates with the popup to update note content

### Table Functionality

The `table.js` file implements spreadsheet-like functionality:

1. **Table Creation and Management**:
   - Creates default table structure
   - Handles loading and saving table content

2. **Cell Behavior**:
   - Implements cell selection, editing, and navigation
   - Manages keyboard shortcuts within cells

3. **Data Operations**:
   - Handles copying selected cells
   - Manages pasting data from external sources (e.g., Excel)

4. **Mode Switching**:
   - Provides functions to enable/disable table mode
   - Coordinates with popup.js for mode transitions

### Options Page

The options page (`options.html` and `options.js`) allows users to customize the extension:

1. **Appearance Settings**:
   - Color selection for notes and background
   - Dark mode toggle

2. **Feature Toggles**:
   - Multi-note mode
   - Export button visibility
   - Word count display
   - Font size selection
   - Styling buttons visibility
   - Table mode toggle

3. **Note Customization**:
   - Renaming of individual notes

4. **Settings Persistence**:
   - Saves all settings to Chrome storage

### Styling

The `styles.css` file provides styling for all components:

1. **General Styles**:
   - Base styling for popup and options pages
   - Animation effects for smooth transitions

2. **Theme Support**:
   - Light and dark mode styling
   - Color scheme management

3. **Component-Specific Styles**:
   - Styling for tabs, buttons, and content areas
   - Table cell styling and selection indicators

4. **Responsive Design**:
   - Handles resizing and layout adjustments

## Data Flow

The extension manages data through these key flows:

1. **Note Content Storage**:
   - Notes are saved to Chrome storage using keys like `textAreaContent_note1`
   - Table content is saved separately using keys like `tableContent_note1`
   - Content is saved automatically on input events

2. **Settings Management**:
   - User preferences are stored in Chrome storage
   - Settings are loaded on initialization of popup and options pages

3. **Inter-Component Communication**:
   - Background script communicates with popup via Chrome messaging
   - Table.js and popup.js coordinate through direct function calls

## Key Features Implementation

### Multi-Note System

The multi-note system allows users to maintain separate notes in tabs:

```javascript
// In popup.js
function setupTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', handleTabClick);
    });
}

function handleTabClick(event) {
    saveCurrentNoteContent(); // Save current note before switching
    currentNote = event.target.getAttribute('data-note');
    loadCurrentNoteContent(); // Load the selected note
    setActiveTabButton();
    chrome.storage.sync.set({ 'lastActiveTab': currentNote }); // Remember last active tab
}
```

- Each note has a unique storage key
- The system remembers the last active tab
- Users can customize tab names in the options page

### Text Formatting

Text formatting is implemented using the `execCommand` API:

```javascript
// In popup.js
boldButton.addEventListener('click', () => {
    noteContent.focus();
    document.execCommand('bold', false, null);
});

italicButton.addEventListener('click', () => {
    noteContent.focus();
    document.execCommand('italic', false, null);
});

underlineButton.addEventListener('click', () => {
    noteContent.focus();
    document.execCommand('underline', false, null);
});
```

- Formatting buttons apply styles to selected text
- The system tracks formatting state to highlight active buttons

### Table Mode

Table mode provides spreadsheet-like functionality:

```javascript
// In popup.js
toggleTableMode.addEventListener('change', () => {
    if (toggleTableMode.checked) {
        enableTableMode(noteContent, spreadsheetContainer, tabContainer, insertDateButton);
        chrome.storage.sync.set({ 'tableMode': true });
    } else {
        disableTableMode(noteContent, spreadsheetContainer, tabContainer, insertDateButton, enableTabs);
        chrome.storage.sync.set({ 'tableMode': false });
    }
});
```

- Users can toggle between text and table modes
- Table content is preserved separately from text content
- The table supports cell selection, navigation, and data operations

### Context Menu Integration

The context menu allows users to add selected text to notes:

```javascript
// In background.js
function contextMenuClickHandler(info, tab) {
    const selectedText = info.selectionText;
    chrome.storage.sync.get(['enableTabs', 'notifywhencontextadd'], (items) => {
        const enableTabs = items.enableTabs;
        const noteId = enableTabs ? info.menuItemId.replace('add-to-note-', '') : 'singleNote';
        const noteKey = enableTabs ? `textAreaContent_note${noteId}` : 'textAreaContent';

        chrome.storage.sync.get([noteKey], (result) => {
            const existingContent = result[noteKey] || '';
            const newContent = existingContent ? `${existingContent}\n\n${selectedText}` : selectedText;

            chrome.storage.sync.set({ [noteKey]: newContent });
            // Notification and message passing logic...
        });
    });
}
```

- Context menu is dynamically created based on enabled notes
- Selected text is appended to the chosen note
- Optional notifications inform users of successful additions

### Theme Support

The extension supports light and dark themes:

```javascript
// In popup.js and options.js
function applyTheme() {
    body.dataset.theme = currentTheme;
    if (currentTheme === 'dark') {
        // Apply dark mode styles
    } else {
        // Apply light mode styles
    }
}
```

- Theme settings affect all UI components
- Table cells and content areas adjust colors based on theme
- Theme preference is stored and applied consistently

## Storage Management

The extension uses Chrome's storage API for persistence:

1. **`chrome.storage.sync`**:
   - Used for settings and note content
   - Syncs across user's devices

2. **`chrome.storage.local`**:
   - Used for table content (which may be larger)
   - Stays local to the current device

Key storage patterns:
- Note content: `textAreaContent_note1`, `textAreaContent_note2`, etc.
- Table content: `tableContent_note1`, `tableContent_note2`, etc.
- Settings: Individual keys like `darkMode`, `showExportButton`, etc.

## Event Handling

The extension uses various event listeners to handle user interactions:

1. **DOM Events**:
   - `DOMContentLoaded` for initialization
   - `input`, `keyup`, and `mouseup` for content changes
   - `click` for button actions

2. **Chrome API Events**:
   - `chrome.commands.onCommand` for keyboard shortcuts
   - `chrome.runtime.onMessage` for message passing
   - `chrome.contextMenus.onClicked` for context menu interactions

3. **Custom Events**:
   - Tab switching
   - Mode toggling
   - Theme changes

This event-driven architecture ensures responsive user interaction and proper state management throughout the extension.
