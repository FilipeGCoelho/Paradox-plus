# Paradox Plus Extension

## Introduction

Paradox Plus is a browser extension designed to enhance the user experience on Paradox's Applicant Tracking System (ATS) website. It aims to streamline navigation and improve efficiency through the use of customizable keyboard shortcuts and additional features.

## Features

- **Customizable Shortcuts**: Users can create and manage keyboard shortcuts for various actions within the ATS, making navigation and tasks more efficient.
- **Popup Interface**: A user-friendly interface where users can manage their shortcuts and settings.
- **Dynamic Content Injection**: The extension dynamically injects elements (like buttons and shortcut containers) into the ATS web pages based on user interactions and stored configurations.
- **Lead and Company ID Display**: Automatically displays Lead and Company IDs on relevant ATS pages for easy reference.
- **Bootstrap Integration**: Utilizes Bootstrap for styling, ensuring a responsive and visually coherent user interface.

## Architecture Overview

### Components

1. **Manifest File**: Defines the basic settings of the extension, including permissions, content scripts, and web-accessible resources.

2. **Content Scripts**: JavaScript files (`content.js`) that interact with web pages, injecting HTML and handling user interactions. These scripts are responsible for the main functionalities like shortcut injection and button functionality.

3. **Popup HTML (`popup.html`)**: The HTML structure for the popup interface, providing a graphical interface for shortcut management.

4. **Popup JavaScript (`popup.js`)**: Handles the logic of the popup interface, including shortcut addition, rendering active shortcuts, and interacting with storage.

5. **Bootstrap**: A front-end framework used for designing the popup interface, ensuring a consistent and responsive design.

### Workflow

1. **Initialization**: Upon navigating to a supported URL (`https://*.paradox.ai/*`), the content script is injected, initiating the extension's functionalities.

2. **Shortcut Management**: Users can add, edit, and delete shortcuts through the popup interface. Changes are reflected in real-time and stored in browser storage.

3. **Content Injection**: Based on user interactions and stored configurations, elements like shortcut containers and buttons are dynamically injected into the web page.

4. **Data Fetching and Display**: The extension fetches specific data like Lead and Company IDs from the ATS and displays them on the page.

## Installation and Usage

1. **Installation**: The extension can be installed via the browser's extension store or by loading the unpacked extension in developer mode.
2. **Configuration**: Users can configure their shortcuts through the popup interface, accessible by clicking the extension icon.

3. **Usage**: While navigating the ATS website, users can utilize their configured shortcuts and view the dynamically injected information like Lead and Company IDs.

## Best Practices

- **Security**: Ensures data integrity and user privacy.
- **Performance Optimization**: Minimizes the impact on web page performance and ensures smooth execution.
- **Cross-Browser Compatibility**: Designed to be compatible with major browsers.
- **User Documentation**: Includes a guide for setup, customization, and troubleshooting.

## Conclusion

Paradox Plus is a tool that significantly enhances the efficiency of navigating and performing tasks within Paradox's ATS. By providing customizable keyboard shortcuts and additional features, it aims to streamline the user experience for frequent users of the platform.

---

Note: For any specific information or functionalities that are unique to this extension and not covered in this overview, please contact filipe.coelho@paradox.ai
