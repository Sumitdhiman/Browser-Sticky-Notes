# Browser Sticky Notes - Code Documentation

This document provides a comprehensive overview of the Browser Sticky Notes extension codebase, explaining the architecture, components, and how they interact with each other.

## Table of Contents

1.  [Overview](#overview)
2.  [Architecture](#architecture)
3.  [Core Components](#core-components)
    *   [Manifest](#manifest)
    *   [Popup Interface](#popup-interface)
    *   [Background Service](#background-service)
    *   [Content Scripts](#content-scripts)
    *   [Table Functionality](#table-functionality)
    *   [Options Page](#options-page)
    *   [Website-Specific Notes Page](#website-specific-notes-page)
    *   [Styling](#styling)
4.  [Data Flow](#data-flow)
5.  [Key Features Implementation](#key-features-implementation)
    *   [Multi-Note System](#multi-note-system)
    *   [Website-Specific Notes](#website-specific-notes)
    *   [Import/Export System](#importexport-system)
    *   [Text Formatting](#text-formatting)
    *   [Table Mode](#table-mode)
    *   [Context Menu Integration](#context-menu-integration)
    *   [Theme Support (Light/Dark)](#theme-support-lightdark)
    *   [Resizable Popup](#resizable-popup)
    *   [Easter Egg (Table Mode Unlock)](#easter-egg-table-mode-unlock)
    *   [Edge Sidebar Integration](#edge-sidebar-integration)
6.  [Storage Management](#storage-management)
7.  [Event Handling](#event-handling)

## Overview

Browser Sticky Notes is a comprehensive browser extension that provides advanced note-taking capabilities directly in the browser. It supports multiple notes, website-specific notes that automatically appear on specific URLs, text formatting, table mode for structured data, import/export functionality for backup and sync, context menu integration, and customizable appearance settings including dark mode. The extension can be used in Microsoft Edge's sidebar for quick access while browsing.

## Architecture

The extension follows a comprehensive browser extension architecture with these main components:

1.  **Manifest (`manifest.json`)**: Defines the extension's properties, permissions, and entry points.
2.  **Popup Interface (`popup.html`, `popup.js`)**: The main user interface that appears when clicking the extension icon or using the keyboard shortcut.
3.  **Background Service (`background.js`)**: Handles background processes like context menu management, keyboard shortcuts, and notifications.
4.  **Content Scripts (`content.js`, `content_style.css`)**: Injected scripts that enable website-specific notes functionality.
5.  **Table Functionality (`table.js`)**: Contains the logic for the spreadsheet-like table mode.
6.  **Options Page (`options.html`, `options.js`)**: Provides customization settings and import/export functionality.
7.  **Website-Specific Notes Page (`sitenotes.html`, `sitenotes.js`, `sitenotes.css`)**: Management interface for viewing and managing all website-specific notes.
8.  **Styling (`styles.css`)**: Defines the visual appearance of the popup and options pages.
9.  **Storage System**: Uses Chrome's storage API (`sync` and `local`) to persist notes, settings, table data, and website-specific notes.

## Core Components

### Manifest

The [`manifest.json`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\manifest.json) file defines the extension's configuration:

```json
// filepath: d:\Developer Work\Beta\Browser-Sticky-Notes\manifest.json
{
  "manifest_version": 3,
  "name": "Browser Sticky Notes",
  "version": "6.0.0", // Updated Version
  "description": "Create sticky notes, attach notes to specific websites, and manage all your thoughts in one place.",
  "action": {
    "default_popup": "popup.html"
  },
  "icons": {
    "16": "assets/icons/icon16.png",
    "48": "assets/icons/icon48.png",
    "128": "assets/icons/icon128.png"
  },
  "permissions": [
    "storage",
    "contextMenus",
    "notifications",
    "tabs",
    "scripting"
  ],
  "host_permissions": [
    "http://*/*",
    "https://*/*"
  ],
  "content_scripts": [
    {
      "matches": ["http://*/*", "https://*/*"],
      "js": ["assets/scripts/content.js"],
      "css": ["assets/scripts/content_style.css"],
      "run_at": "document_end"
    }
  ],
  "background": {
    "service_worker": "assets/scripts/background.js"
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
- Uses Manifest V3.
- Defines keyboard shortcut (`Shift+Alt+N`).
- Requests permissions for `storage`, `contextMenus`, `notifications`, `tabs`, and `scripting` for website-specific notes.
- Includes `host_permissions` for all HTTP/HTTPS sites to enable content script injection.
- Defines content scripts that run on all web pages for website-specific notes functionality.
- Specifies background service worker, popup, and options page.
- Includes icons for different resolutions in the assets folder structure.

### Popup Interface

The popup interface ([`popup.html`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.html) and [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js)) provides the main user interaction point.

#### HTML Structure (`popup.html`)

The popup interface consists of:
- Header with title and settings icon ([`settingsIcon`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L3)).
- Tab navigation ([`tabContainer`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L6)) for multiple notes (if enabled).
- Hidden toggle ([`modeToggle`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L103)) for table mode (revealed by easter egg).
- Hidden table controls ([`tableControlsContainer`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.html#L31)) for adding/deleting rows/columns.
- Button to create website-specific notes ([`createUrlNoteButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L4)).
- Editable content area ([`noteContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L15)).
- Spreadsheet container ([`spreadsheetContainer`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L17)) for table mode.
- Styling buttons ([`stylingButtonsContainer`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L14)) for text formatting (bold, italic, underline, insert date).
- Export button ([`exportButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L4)).
- Resizable handle ([`resizeHandle`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L13)).
- Hidden `h2.bmc` element for easter egg activation.

#### JavaScript Logic (`popup.js`)

The [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) file handles:
1.  **Initialization**: Loads settings (`chrome.storage.sync.get`), sets up event listeners, configures UI based on settings (tabs, theme, visibility of elements).
2.  **Note Management**: Handles tab switching ([`handleTabClick`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L106)), loads ([`loadCurrentNoteContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L125), [`loadSingleNoteContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L143)) and saves ([`saveCurrentNoteContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L135), [`saveSingleNoteContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L153)) note/table content. Manages single vs. multi-note modes based on `enableTabs` setting.
3.  **Website-Specific Notes**: Creates notes attached to specific URLs via the "Add Note for this site" button, which injects content scripts and automatically closes the popup.
4.  **Text Formatting**: Implements bold ([`boldButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L11)), italic ([`italicButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L12)), underline ([`underlineButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L13)) using `document.execCommand`. Provides date insertion ([`insertDateButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L16), [`insertHtmlAtCursor`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L270)). Updates button states ([`updateButtonStates`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L330)).
5.  **Table Mode Integration**: Toggles ([`toggleTableMode`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L17)) between text and table modes using functions from [`table.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js) ([`enableTableMode`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L68), [`disableTableMode`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L101)). Handles table pasting ([`handleTablePaste`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L308)).
6.  **UI Customization**: Applies theme ([`body.dataset.theme`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L90)), background colors, font size based on settings.
7.  **Resizing**: Implements popup resizing via a handle ([`resizeHandle`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L13)).
8.  **Export Functionality**: Exports note content as a `.txt` file or table content as a `.csv` file depending on mode ([`exportButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L4)).
9.  **Message Handling**: Listens for messages (`chrome.runtime.onMessage`) to add text, update table content, or unlock table mode.
10. **Easter Egg**: Listens for clicks on `h2.bmc` to unlock table mode ([`handleBmcClick`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L476)).

### Background Service

The [`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js) file runs as a service worker and handles:

1.  **Context Menu Integration**: Creates ([`createContextMenu`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js#L7)) and manages context menu items (`Add to Note...`). Context menu creation is skipped if `tableMode` is enabled. Updates menu ([`updateContextMenu`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js#L62)) when `enableTabs` or `tableMode` settings change. Handles clicks ([`contextMenuClickHandler`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js#L83)) to add selected text to notes with improved error handling.
2.  **Keyboard Shortcut Handling**: Listens (`chrome.commands.onCommand`) for the `open_popup` command (`Shift+Alt+N`) to open the popup.
3.  **Notification Management**: Shows notifications (`chrome.notifications.create`) when text is added via context menu (if enabled) with proper icon paths.
4.  **Initialization & Updates**: Sets default settings on install (`chrome.runtime.onInstalled`). Updates context menu on install, update, or startup (`chrome.runtime.onStartup`).
5.  **Message Handling**: Listens for messages (`chrome.runtime.onMessage`) related to the table mode unlock easter egg.

### Content Scripts

The content script system enables website-specific notes functionality:

#### Content Script (`content.js`)

The [`content.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\content.js) file handles:
1.  **Website-Specific Note Creation**: Creates floating note UI elements that attach to specific URLs.
2.  **Note Storage and Retrieval**: Saves and loads notes using URL-based keys in `chrome.storage.local`.
3.  **Auto-Display**: Automatically shows existing notes when visiting a page that has an associated note.
4.  **Draggable Interface**: Makes notes draggable so users can position them anywhere on the page.
5.  **Note Management**: Provides edit, save, and delete functionality for website notes.

#### Content Styles (`content_style.css`)

The [`content_style.css`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\content_style.css) file provides:
1.  **Note Styling**: Styles for the floating note interface including background, borders, and shadows.
2.  **Responsive Design**: Ensures notes display properly across different screen sizes.
3.  **Z-index Management**: Ensures notes appear above page content without interfering with site functionality.

### Table Functionality

The [`table.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js) file implements the spreadsheet-like functionality:

1.  **Table Creation and Management**: Creates default table structure ([`createDefaultTable`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L5)). Handles loading ([`loadTableContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L49)) and saving ([`saveTableContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L29)) table content to `chrome.storage.local` using note-specific keys (`tableContent_noteX`).
2.  **Table Controls**: Provides functions to add ([`addRow`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L160), [`addColumn`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L201)) and delete ([`deleteRow`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L242), [`deleteColumn`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L261)) rows and columns. Sets up event listeners for control buttons ([`setupTableControls`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L132)).
3.  **Cell Behavior**: Implements cell selection (single, multi-select with Ctrl/Shift), editing, keyboard navigation (Tab, Enter), and styling ([`setupCellBehavior`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L341)). Updates cell styles based on theme ([`updateTableCellStyles`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L501)).
4.  **Data Operations**: Handles copying selected cells to clipboard ([`copySelectedCells`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L458)). Manages pasting data from external sources ([`handleTablePaste`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L308)).
5.  **Mode Switching**: Provides functions called by `popup.js` to enable ([`enableTableMode`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L68)) and disable ([`disableTableMode`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L101)) table mode, managing UI visibility.

### Options Page

The options page ([`options.html`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.html) and [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js)) allows users to customize the extension:

1.  **Appearance Settings**: Color selection for notes ([`colorPalette`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L2)) and background ([`backgroundColorPalette`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L3)). Dark mode toggle ([`darkModeToggle`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L11)). Large font toggle ([`useLargeFontCheckbox`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L9)).
2.  **Feature Toggles**: Enable multi-note mode ([`enableTabsCheckbox`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L8)). Show export button ([`showExportCheckbox`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L7)). Show styling buttons ([`showStylingButtonsCheckbox`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L14)). Notify on context add ([`notifyWhenContextAddCheckbox`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L15)). Enable table mode (hidden by default, [`hideTableModeToggleCheckbox`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L16)).
3.  **Import/Export System**: Full backup and restore functionality for all extension data including notes, settings, and website-specific notes using JSON format.
4.  **Website-Specific Notes Management**: Link to the Site Notes page for viewing and managing all website-specific notes.
5.  **Note Customization**: Renaming of individual notes ([`note1NameInput`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L17), [`note2NameInput`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L18), [`note3NameInput`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L19), [`renameButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L20)).
6.  **Settings Persistence**: Loads settings on initialization and saves all settings to `chrome.storage.sync` on change.
7.  **Easter Egg**: Listens for clicks on `h2.bmc` elements to unlock and reveal the table mode toggle ([`handleBmcClick`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L206)).

### Website-Specific Notes Page

The website-specific notes management system ([`sitenotes.html`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\sitenotes.html), [`sitenotes.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\sitenotes.js), and [`sitenotes.css`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\sitenotes.css)) provides:

1.  **Note Management Interface**: Card-based layout displaying all website-specific notes with their associated URLs.
2.  **Search and Filter**: Ability to filter notes by URL or content for easy management.
3.  **Delete Functionality**: Individual note deletion with confirmation prompts.
4.  **Theme Support**: Consistent dark/light theme styling matching the main extension interface.
5.  **Responsive Design**: Adapts to different screen sizes for optimal viewing experience.

### Styling

The [`styles.css`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\styles.css) file provides styling for all components:

1.  **General Styles**: Base styling for popup and options pages, layout using flexbox. Defines CSS variables for a cohesive light/dark theme based on a modern color palette.
2.  **Theme Support**: Light (`body` or `body[data-theme="light"]`) and dark (`body[data-theme="dark"]`) mode styling using the defined CSS variables.
3.  **Component-Specific Styles**: Styling for header, tabs (underline indicator), buttons (styling, actions, table controls), content areas (`#noteContent`, `#spreadsheetContainer`), palettes, toggles (switches), table cells (including selection and focus states), resize handle.
4.  **Animations**: Fade-in effect for popup, transitions for buttons and color boxes, copy flash animation for table cells.
5.  **Icons**: Uses Font Awesome for icons in buttons.
6.  **Responsiveness**: Basic responsive adjustments remain for the options page grid.

## Data Flow

1.  **Note Content Storage**: Text note content is saved to `chrome.storage.sync` using keys like `textAreaContent_note1`, `textAreaContent_note2`, `textAreaContent_note3`, or `textAreaContent` (for single note mode). Content is saved automatically on input events in [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js).
2.  **Website-Specific Notes Storage**: Website notes are saved to `chrome.storage.local` using URL-based keys (e.g., `note_https://example.com`) to handle potentially large amounts of data and maintain performance.
3.  **Table Content Storage**: Table HTML content is saved to `chrome.storage.local` using keys like `tableContent_note1`, `tableContent_note2`, `tableContent_note3`. Saving is triggered by input events (debounced) and mode switching in [`table.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js).
4.  **Settings Management**: User preferences (colors, toggles, note names, theme, unlocked status) are stored in `chrome.storage.sync`. Settings are loaded on initialization of [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) and [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js), and saved immediately on change in [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js).
5.  **Import/Export Operations**: The import/export system in [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js) handles complete data backup and restoration by combining data from both `chrome.storage.sync` and `chrome.storage.local`.
6.  **Inter-Component Communication**:
    *   [`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js) sends messages (`chrome.runtime.sendMessage`) to [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) to add text from the context menu or notify about table mode unlock.
    *   [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js) sends messages to notify [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) about table mode unlock.
    *   [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) injects content scripts via `chrome.scripting.executeScript` for website-specific note functionality.
    *   [`content.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\content.js) operates independently, managing website-specific notes in the page context.
    *   [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) directly calls functions in [`table.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js) (e.g., [`enableTableMode`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L68), [`disableTableMode`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L101), [`loadTableContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L49), [`saveTableContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L29)).
    *   Storage changes (`chrome.storage.onChanged`) trigger updates in [`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js) (for context menu) and [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) (for styling button visibility, table cell styles).

## Key Features Implementation

### Multi-Note System

Managed in [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) based on the `enableTabs` setting:
- If enabled, [`tabContainer`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L6) is shown, and tabs switch between notes (`note1`, `note2`, `note3`).
- [`handleTabClick`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L106) saves the current note/table content before loading the new one.
- Note names are customizable via [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js).
- The last active tab is saved (`lastActiveTab`) and restored.
- If disabled, tabs are hidden, and a single note (`singleNote`) is used.

### Website-Specific Notes

A core feature that allows users to create notes attached to specific websites:
- **Creation**: Users can create website-specific notes via the "Add Note for this site" button in the popup.
- **Auto-Display**: Notes automatically appear when visiting a page that has an associated note.
- **Storage**: Notes are stored using URL-based keys in `chrome.storage.local` for performance.
- **Content Script Integration**: Uses [`content.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\content.js) injected via `chrome.scripting.executeScript`.
- **Management Interface**: Complete management system via [`sitenotes.html`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\sitenotes.html) for viewing, editing, and deleting all website notes.
- **Draggable UI**: Notes can be repositioned on the page and remember their position.

### Import/Export System

Comprehensive backup and restore functionality implemented in [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js):
- **Complete Backup**: Exports all extension data including regular notes, settings, table content, and website-specific notes.
- **JSON Format**: Uses JSON format for easy data portability and human readability.
- **Selective Restore**: Import system intelligently handles existing data and provides options for data merging.
- **File Operations**: Handles file download for export and file upload for import using standard browser APIs.
- **Data Validation**: Includes validation to ensure imported data is in the correct format.

### Text Formatting

Implemented in [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) using `document.execCommand`:
- Buttons ([`boldButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L11), [`italicButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L12), [`underlineButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L13)) apply styles to the [`noteContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L15) div.
- [`insertDateButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L16) inserts the current date using [`insertHtmlAtCursor`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L270).
- Button states ([`updateButtonStates`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L330)) reflect the current selection's format.
- Visibility controlled by `showStylingButtons` setting.

### Table Mode

A hidden feature providing spreadsheet-like functionality, primarily managed by [`table.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js) and toggled in [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js):
- Unlocked via an easter egg (clicking `h2.bmc` 5 times in [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) or [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js)).
- The toggle ([`toggleTableMode`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L17)) appears in the popup once unlocked (`tableModeUnlocked` setting).
- When enabled:
    - [`noteContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L15) and styling buttons are hidden.
    - [`spreadsheetContainer`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L17) and table controls are shown.
    - Table content is loaded/saved from `chrome.storage.local` ([`loadTableContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L49), [`saveTableContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L29)).
    - Tabs are hidden as table content is per-note but not switched via tabs in this mode.
- [`table.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js) handles cell interactions, data operations (copy/paste), and row/column manipulation.

### Context Menu Integration

Managed by [`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js):
- Creates context menu items for selected text (`Add to Note...`).
- Menu items adapt based on `enableTabs` setting (shows individual notes or a single option).
- Context menu is *not* created if `tableMode` setting is true.
- [`contextMenuClickHandler`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js#L83) appends selected text to the appropriate note's content in `chrome.storage.sync`.
- Improved error handling for context menu operations and messaging.
- Sends a message to the popup to potentially update the view if open.
- Shows a notification (if `notifywhencontextadd` is true) with proper icon paths.

### Theme Support (Light/Dark)

Implemented using a `data-theme` attribute on the `<body>` tag in [`popup.html`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.html) and [`options.html`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.html):
- Controlled by the `darkMode` setting toggled in [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js).
- [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) and [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js) apply the theme on load.
- [`styles.css`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\styles.css) contains specific rules for `body[data-theme="dark"]` to adjust colors and backgrounds.
- Table cell styles ([`updateTableCellStyles`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L501)) are updated dynamically based on the theme.

### Resizable Popup

Implemented in [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js):
- A resize handle ([`resizeHandle`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L13)) is positioned at the bottom-left corner.
- Mouse events (`mousedown`, `mousemove`, `mouseup`) track dragging.
- `requestAnimationFrame` is used in the `mousemove` handler for smoother resizing, updating the `width` and `height` of the [`popupBody`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L7).

### Easter Egg (Table Mode Unlock)

Implemented in both [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) ([`handleBmcClick`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L476)) and [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js) ([`handleBmcClick`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L206)):
- Clicking any `h2.bmc` element 5 times within a short timeout period triggers the unlock.
- Sets the `tableModeUnlocked` flag to `true` in `chrome.storage.sync`.
- Updates the UI immediately (shows toggle in popup/options, displays a confirmation message).
- Sends a message (`unlockTableMode`) to potentially update other open extension views.

### Edge Sidebar Integration

The extension can be used in the Microsoft Edge sidebar for quick access while browsing. This allows users to easily create, edit, and manage both regular notes and website-specific notes without leaving their current webpage. The website-specific notes feature is particularly powerful when used in the sidebar, as users can quickly create notes for the current page they're viewing.

## Storage Management

The extension uses Chrome's storage API:

1.  **`chrome.storage.sync`**:
    *   Used for settings (booleans like `darkMode`, `enableTabs`, `showExportButton`, `useLargeFont`, `showStylingButtons`, `notifywhencontextadd`, `tableMode`, `tableModeUnlocked`), colors (`textAreaBgColor`, `backgroundColor`), note names (`note1Name`, `note2Name`, `note3Name`), and the last active tab (`lastActiveTab`).
    *   Used for text note content (`textAreaContent_note1`, `textAreaContent_note2`, `textAreaContent_note3`, `textAreaContent`).
    *   Syncs across user's devices (subject to quotas).
    *   Note: Word count setting (`showWordCount`) has been removed from the extension.

2.  **`chrome.storage.local`**:
    *   Used for table content HTML (`tableContent_note1`, `tableContent_note2`, `tableContent_note3`). Chosen due to potentially larger size compared to text notes, avoiding `sync` storage limitations.
    *   Used for website-specific notes storage with URL-based keys (e.g., `note_https://example.com`) to handle potentially large amounts of site-specific data efficiently.
    *   Stays local to the current device.

3.  **Import/Export Data Management**:
    *   The import/export system combines data from both storage areas to create complete backups.
    *   Export creates a comprehensive JSON file containing all notes, settings, and website-specific data.
    *   Import validates and restores data to appropriate storage locations while preserving data integrity.

## Event Handling

1.  **DOM Events**:
    *   `DOMContentLoaded`: Initialize scripts ([`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js), [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js), [`sitenotes.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\sitenotes.js)).
    *   `click`: Handle button clicks (tabs, settings, export, formatting, table controls, save, rename, easter egg, website note creation, note deletion).
    *   `input`: Save note/table content, update formatting button states.
    *   `change`: Handle toggle switch changes (options page, table mode toggle).
    *   `mousedown`, `mousemove`, `mouseup`: Handle popup resizing and note dragging in content scripts.
    *   `keydown`: Handle table cell navigation (Tab, Enter) and copy (Ctrl+C).
    *   `paste`: Handle pasting into table ([`handleTablePaste`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L308)).
    *   `blur`, `focus`: Manage table cell selection state and styling.
    *   `scroll`: Update table container shadow for scroll indication.
    *   `beforeunload`: Save table content before popup closes.

2.  **Chrome API Events**:
    *   `chrome.commands.onCommand`: Handle keyboard shortcut ([`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js)).
    *   `chrome.runtime.onInstalled`: Set defaults and update context menu ([`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js)).
    *   `chrome.runtime.onStartup`: Ensure context menu exists ([`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js)).
    *   `chrome.runtime.onMessage`: Handle communication between scripts ([`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js), [`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js)).
    *   `chrome.contextMenus.onClicked`: Handle context menu actions ([`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js)).
    *   `chrome.storage.onChanged`: React to setting changes (update context menu in [`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js), update UI in [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js)).
    *   `chrome.notifications.onClosed`: Clear notification data ([`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js)).

3.  **Content Script Events**:
    *   Website-specific note events handled in [`content.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\content.js) for creating, editing, saving, and positioning notes on web pages.
    *   Storage events for loading and saving website-specific notes with URL-based keys.

4.  **File Handling Events**:
    *   File input events for import functionality in [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js).
    *   Blob creation and download events for export functionality.
