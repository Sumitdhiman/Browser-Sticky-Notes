

# Browser Sticky Notes Extension Documentation

This documentation describes the key files for the Browser Sticky Notes extension. The extension provides a lightweight way to create and manage digital sticky notes directly in your web browser. The following sections detail the structure and functionality of the main files: **popup.html**, **popup.js**, and **options.html**.

---

## Table of Contents

- [Overview](#overview)
- [popup.html](#popuphtml)
- [popup.js](#popupjs)
- [options.html](#optionshtml)
- [Additional Notes](#additional-notes)

---

## Overview

The Browser Sticky Notes extension is designed to:
- Provide an on-demand popup window for writing and editing sticky notes.
- Offer a multi-note mode with tab navigation (if enabled) or a single-note mode.
- Allow users to style note text (bold, italic, underline) and insert the current date.
- Automatically count words, save content locally via Chrome’s storage, and export notes to a plain text file.
- Enable customization of the appearance (note colors, background colors, dark mode, etc.) via an options page.

---

## popup.html

**Purpose:**  
This file defines the structure of the popup window that appears when the extension is activated. It sets up the UI components needed for the note-taking experience.

**Key Components:**

- **Header Section:**
  - Contains the title "Browser Sticky Notes" and a gear icon.
  - The gear icon is wired to open the options page using Chrome’s settings API.

- **Tab Navigation:**
  - A section defined by a `<div>` with the class `tab-container`.
  - Includes three buttons (one for each note) with the `data-note` attribute. These buttons allow users to switch between multiple notes (multi-note mode).

- **Note Content Area:**
  - A `<div>` with the attribute `contenteditable="true"` for rich text editing.
  - Styled to ensure a minimum height along with border settings for clear separation.

- **Styling Buttons:**
  - Buttons for **Bold**, **Italic**, **Underline** formatting, and an **Insert Date** button to quickly add the current date.
  
- **Word Count and Export Button:**
  - A live word count displayed within a `<div>` that is updated based on content changes.
  - An "Export as .txt" button facilitates saving the note content as a text file.

- **Resize Handle:**
  - A small area (using an empty `<div>`) that lets the user resize the popup by dragging.

- **Script Inclusion:**
  - Imports `popup.js` which contains all the interactive behavior and logic for this page.

---

## popup.js

**Purpose:**  
This file contains the JavaScript logic for powering the popup’s UI. It handles events, data storage, and user interactivity.

**Key Features and Functionalities:**

- **Initialization:**
  - Listens for the `DOMContentLoaded` event to initialize the UI components.
  - Immediately adds transition classes to bring the popup into view (using the `popup-open` class).

- **Storage & Settings Handling:**
  - Uses Chrome’s `chrome.storage.sync` API to retrieve user settings (such as note colors, whether to show export button, multi-note mode, dark mode, and font size preferences).
  - Adjusts the UI elements based on the stored settings:
    - Sets the background color of the note content area.
    - Shows or hides the export button, word count, and styling buttons.
    - Switches between multi-note (tab) and single-note modes.
    - Updates the visual theme (dark or light) for the popup.

- **Multi-note Tab Management:**
  - Implements functions such as `setupTabs()`, `handleTabClick()`, `loadCurrentNoteContent()`, and `saveCurrentNoteContent()` to maintain different note tabs.
  - Remembers the last active note tab to improve the user experience.

- **Content Synchronization:**
  - Listens to user input events on the note content area and saves changes automatically (using either `innerHTML` for rich text with formatting).
  - Updates the word count dynamically as the user types.

- **Text Formatting & Insert Date:**
  - Implements click event listeners for the Bold, Italic, and Underline buttons by making use of `document.execCommand`.
  - Offers an `insertHtmlAtCursor()` function to insert the current date at the cursor position (triggered by the Insert Date button).

- **Export Functionality:**
  - When the export button is clicked, the script converts the note’s inner text to a blob and triggers a download (using a temporary anchor element created in the code).

- **Resize Functionality:**
  - Monitors mouse events (mousedown, mousemove, mouseup) on the resize handle to allow users to dynamically adjust the popup dimensions.

- **Message Listener:**
  - Listens for incoming messages (e.g., to add text to a note) through `chrome.runtime.onMessage`, ensuring that content is updated remotely if needed.

---

## options.html

**Purpose:**  
This file defines the layout of the options page, which allows users to customize the extension settings and appearance.

**Key Components:**

- **Color Palettes:**
  - Two separate palettes for choosing:
    - The note color.
    - The background color.
  - Each palette is rendered in a grid layout with clickable color boxes. A save button next to each palette commits the chosen color.

- **Customization Settings:**
  - A sidebar containing several toggle switches:
    - Enable Multi-Note Mode (tab navigation).
    - Show Export Button.
    - Use Large Font.
    - Show Word Count.
    - Dark Mode.
    - Show Styling Buttons.
  - These toggle controls are wired to update Chrome’s storage so that the popup reflects user preferences immediately.

- **Rename Notes Section:**
  - Input fields to allow the user to rename individual note tabs (Note 1, Note 2, Note 3).
  - A rename button saves changes to Chrome’s storage and updates the popup in real time.

- **Additional Information and Actions:**
  - Sections explaining the keyboard shortcut for opening the popup (Shift + Alt + N).
  - A donate section with a “Buy Me A Coffee” button and links to rate the extension or report issues.
  
- **Script Inclusion:**
  - Includes `options.js` to handle the interactivity (event listeners, palette rendering, saving settings, etc.).

---

## Additional Notes

- **Styling:**  
  The extension uses an external CSS file (`styles.css`) to style all pages. It handles responsive design, animations (like slide-in for the popup), and dark/light theme transitions.

- **Integration with Chrome APIs:**  
  Both the popup and options pages utilize Chrome’s extension APIs (such as `chrome.storage.sync` and `chrome.runtime`) for storage, messaging, and opening the options page.

- **Extensibility:**  
  The extension is designed to be modular. For example, the message listener in `popup.js` allows for text to be added externally (from a context menu implemented in the background script), making it easier to extend functionality.

---

This documentation should give developers and maintainers a clear understanding of the extension’s structure and functionality. It details how the UI is built, how user interactions are handled, and how settings are persisted across user sessions.
