# Browser Sticky Notes - Code Documentation

This document provides a comprehensive overview of the Browser Sticky Notes extension codebase, explaining the architecture, components, and how they interact with each other.

## Table of Contents

1.  [Overview](#overview)
2.  [Architecture](#architecture)
3.  [Core Components](#core-components)
    *   [Manifest](#manifest)
    *   [Popup Interface](#popup-interface)
    *   [Background Service](#background-service)
    *   [Table Functionality](#table-functionality)
    *   [Options Page](#options-page)
    *   [Styling](#styling)
4.  [Data Flow](#data-flow)
5.  [Key Features Implementation](#key-features-implementation)
    *   [Multi-Note System](#multi-note-system)
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

Browser Sticky Notes is a browser extension that provides a convenient way to create, edit, and manage notes directly in the browser. It supports multiple notes (configurable), text formatting, an optional table mode for structured data, context menu integration, and customizable appearance settings including dark mode. In Microsoft Edge, it can be used in the sidebar for quick access while browsing.

## Architecture

The extension follows a standard browser extension architecture with these main components:

1.  **Manifest (`manifest.json`)**: Defines the extension's properties, permissions, and entry points.
2.  **Popup Interface (`popup.html`, `popup.js`)**: The main user interface that appears when clicking the extension icon or using the keyboard shortcut.
3.  **Background Service (`background.js`)**: Handles background processes like context menu management, keyboard shortcuts, and notifications.
4.  **Table Functionality (`table.js`)**: Contains the logic for the spreadsheet-like table mode.
5.  **Options Page (`options.html`, `options.js`)**: Provides customization settings for the extension.
6.  **Styling (`styles.css`)**: Defines the visual appearance of the popup and options pages.
7.  **Storage System**: Uses Chrome's storage API (`sync` and `local`) to persist notes, settings, and table data.

## Core Components

### Manifest

The [`manifest.json`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\manifest.json) file defines the extension's configuration:

```json
// filepath: d:\Developer Work\Beta\Browser-Sticky-Notes\manifest.json
{
  "manifest_version": 3,
  "name": "Browser Sticky Notes",
  "version": "5.0.2", // Updated Version
  "description": "Opens a Sticky note on the Page when invoked using Shift+ALT+N.",
  "action": {
    "default_popup": "popup.html"
  },
  "icons": { // Added Icons section
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
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
- Uses Manifest V3.
- Defines keyboard shortcut (`Shift+Alt+N`).
- Requests permissions for `storage`, `contextMenus`, and `notifications`.
- Specifies background service worker ([`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js)), popup ([`popup.html`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.html)), and options page ([`options.html`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.html)).
- Includes icons for different resolutions.

### Popup Interface

The popup interface ([`popup.html`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.html) and [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js)) provides the main user interaction point.

#### HTML Structure (`popup.html`)

The popup interface consists of:
- Header with title and settings icon ([`settingsIcon`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L3)).
- Tab navigation ([`tabContainer`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L6)) for multiple notes (if enabled).
- Hidden toggle ([`modeToggle`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L103)) for table mode (revealed by easter egg).
- Hidden table controls ([`tableControlsContainer`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.html#L31)) for adding/deleting rows/columns.
- Editable content area ([`noteContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L15)).
- Spreadsheet container ([`spreadsheetContainer`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L17)) for table mode.
- Styling buttons ([`stylingButtonsContainer`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L14)) for text formatting (bold, italic, underline, insert date).
- Word count display ([`wordCount`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L5)).
- Export button ([`exportButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L4)).
- Resizable handle ([`resizeHandle`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L13)).
- Hidden `h2.bmc` element for easter egg activation.

#### JavaScript Logic (`popup.js`)

The [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) file handles:
1.  **Initialization**: Loads settings (`chrome.storage.sync.get`), sets up event listeners, configures UI based on settings (tabs, theme, visibility of elements).
2.  **Note Management**: Handles tab switching ([`handleTabClick`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L106)), loads ([`loadCurrentNoteContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L125), [`loadSingleNoteContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L143)) and saves ([`saveCurrentNoteContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L135), [`saveSingleNoteContent`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L153)) note/table content. Manages single vs. multi-note modes based on `enableTabs` setting.
3.  **Text Formatting**: Implements bold ([`boldButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L11)), italic ([`italicButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L12)), underline ([`underlineButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L13)) using `document.execCommand`. Provides date insertion ([`insertDateButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L16), [`insertHtmlAtCursor`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L270)). Updates button states ([`updateButtonStates`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L330)). Tracks and displays word count ([`updateWordCount`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L183)).
4.  **Table Mode Integration**: Toggles ([`toggleTableMode`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L17)) between text and table modes using functions from [`table.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js) ([`enableTableMode`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L68), [`disableTableMode`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L101)). Handles table pasting ([`handleTablePaste`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js#L308)).
5.  **UI Customization**: Applies theme ([`body.dataset.theme`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L90)), background colors, font size based on settings.
6.  **Resizing**: Implements popup resizing via a handle ([`resizeHandle`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L13)).
7.  **Export Functionality**: Exports note or table content as a `.txt` file ([`exportButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L4)).
8.  **Message Handling**: Listens for messages (`chrome.runtime.onMessage`) to add text, update table content, or unlock table mode.
9.  **Easter Egg**: Listens for clicks on `h2.bmc` to unlock table mode ([`handleBmcClick`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js#L476)).

### Background Service

The [`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js) file runs as a service worker and handles:

1.  **Context Menu Integration**: Creates ([`createContextMenu`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js#L7)) and manages context menu items (`Add to Note...`). Context menu creation is skipped if `tableMode` is enabled. Updates menu ([`updateContextMenu`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js#L62)) when `enableTabs` or `tableMode` settings change. Handles clicks ([`contextMenuClickHandler`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js#L83)) to add selected text to notes.
2.  **Keyboard Shortcut Handling**: Listens (`chrome.commands.onCommand`) for the `open_popup` command (`Shift+Alt+N`) to open the popup.
3.  **Notification Management**: Shows notifications (`chrome.notifications.create`) when text is added via context menu (if enabled).
4.  **Initialization & Updates**: Sets default settings on install (`chrome.runtime.onInstalled`). Updates context menu on install, update, or startup (`chrome.runtime.onStartup`).
5.  **Message Handling**: Listens for messages (`chrome.runtime.onMessage`) related to the table mode unlock easter egg.

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
2.  **Feature Toggles**: Enable multi-note mode ([`enableTabsCheckbox`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L8)). Show export button ([`showExportCheckbox`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L7)). Show word count ([`showWordCountCheckbox`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L10)). Show styling buttons ([`showStylingButtonsCheckbox`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L14)). Notify on context add ([`notifyWhenContextAddCheckbox`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L15)). Enable table mode (hidden by default, [`hideTableModeToggleCheckbox`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L16)).
3.  **Note Customization**: Renaming of individual notes ([`note1NameInput`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L17), [`note2NameInput`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L18), [`note3NameInput`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L19), [`renameButton`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L20)).
4.  **Settings Persistence**: Loads settings on initialization and saves all settings to `chrome.storage.sync` on change.
5.  **Easter Egg**: Listens for clicks on `h2.bmc` elements to unlock and reveal the table mode toggle ([`handleBmcClick`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js#L206)).

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
2.  **Table Content Storage**: Table HTML content is saved to `chrome.storage.local` using keys like `tableContent_note1`, `tableContent_note2`, `tableContent_note3`. Saving is triggered by input events (debounced) and mode switching in [`table.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\table.js).
3.  **Settings Management**: User preferences (colors, toggles, note names, theme, unlocked status) are stored in `chrome.storage.sync`. Settings are loaded on initialization of [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) and [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js), and saved immediately on change in [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js).
4.  **Inter-Component Communication**:
    *   [`background.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\background.js) sends messages (`chrome.runtime.sendMessage`) to [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) to add text from the context menu or notify about table mode unlock.
    *   [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js) sends messages to notify [`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js) about table mode unlock.
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
- Sends a message to the popup to potentially update the view if open.
- Shows a notification (if `notifywhencontextadd` is true).

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

The extension can be used in the Microsoft Edge sidebar for quick access while browsing. This allows users to easily create, edit, and manage notes without leaving their current webpage.

## Storage Management

The extension uses Chrome's storage API:

1.  **`chrome.storage.sync`**:
    *   Used for settings (booleans like `darkMode`, `enableTabs`, `showExportButton`, `showWordCount`, `useLargeFont`, `showStylingButtons`, `notifywhencontextadd`, `tableMode`, `tableModeUnlocked`), colors (`textAreaBgColor`, `backgroundColor`), note names (`note1Name`, `note2Name`, `note3Name`), and the last active tab (`lastActiveTab`).
    *   Used for text note content (`textAreaContent_note1`, `textAreaContent_note2`, `textAreaContent_note3`, `textAreaContent`).
    *   Syncs across user's devices (subject to quotas).

2.  **`chrome.storage.local`**:
    *   Used exclusively for table content HTML (`tableContent_note1`, `tableContent_note2`, `tableContent_note3`). Chosen likely due to potentially larger size compared to text notes, avoiding `sync` storage limitations.
    *   Stays local to the current device.

## Event Handling

1.  **DOM Events**:
    *   `DOMContentLoaded`: Initialize scripts ([`popup.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\popup.js), [`options.js`](d:\Developer%20Work\Beta\Browser-Sticky-Notes\options.js)).
    *   `click`: Handle button clicks (tabs, settings, export, formatting, table controls, save, rename, easter egg).
    *   `input`: Save note/table content, update word count, update formatting button states.
    *   `change`: Handle toggle switch changes (options page, table mode toggle).
    *   `mousedown`, `mousemove`, `mouseup`: Handle popup resizing.
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
