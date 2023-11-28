async function loadFileContent(filename, handler) {
  const response = await fetch(chrome.runtime.getURL(filename));
  return (await handler?.(response)) ?? (await response.text());
}

async function assembleAndInjectHTML(instructions) {
  if (instructions.content && instructions.parent.selector) {
    let content = await loadFileContent(instructions.content);
    let parent = document.querySelector(instructions.parent.selector);
    if (!parent)
      parent = document.querySelector(instructions.parent.alternativeSelector);
    if (parent && content) {
      let toInject = content;
      //Replace placeholders
      instructions.toReplace?.forEach(
        (toReplace) =>
          (toInject = toInject.replaceAll(toReplace.from, toReplace.to))
      );
      //Find parent Element and inject element
      parent.insertAdjacentHTML(
        instructions.parent.injectLocation ?? "beforeend",
        toInject
      );

      //Recursively call remaining children
      instructions.children?.forEach((child) => assembleAndInjectHTML(child));
    }
  }
}

async function injectButton() {
  let header = document.querySelector("header#app-header section");
  let buttonHTML = null;

  if (!header) {
    header = document.querySelector("div#app-dialog");
    buttonHTML = await loadFileContent("elements/button_app_dialog.html");
    if (!header) return;
  } else {
    buttonHTML = await loadFileContent("elements/button.html");
  }

  header.insertAdjacentHTML("afterbegin", buttonHTML);

  const button = header.querySelector(".el-button--default.f060a5");
  button.addEventListener("click", toggleShortcutContainer);
}

function injectShortcutContainer() {
  return new Promise(async (resolve, reject) => {
    try {
      let shortcuts;
      chrome.storage.local.get({ shortcuts: {} }, async function (result) {
        if (
          result &&
          result.shortcuts &&
          Object.keys(result.shortcuts).length > 0
        ) {
          shortcuts = createJsonStructure(result);
        } else {
          // If no structure in local storage, load from file
          shortcuts = await loadFileContent(
            "config/shortcut-structure.json",
            (res) => res.json()
          );
        }
        await assembleAndInjectHTML(shortcuts);
        resolve(); // Resolve the promise after successful injection
      });
    } catch (error) {
      console.error("Error in injectShortcutContainer:", error);
      reject(error); // Reject the promise if an error occurs
    }
  });
}

function toggleShortcutContainer() {
  let container = document.querySelector(".el-dialog__wrapper.cba824");
  if (!container) {
    container = document.querySelector("div.el-dialog__wrapper");
    if (!container) return;
  }

  if (container.style.display === "none") {
    container.style.display = "block";
    showOverlay();
  } else {
    container.style.display = "none";
    hideOverlay();
  }
}

function showOverlay() {
  const overlayHTML =
    '<div class="v-modal _1783a4" tabindex="0" style="z-index: 1029;"></div>';
  document.body.insertAdjacentHTML("beforeend", overlayHTML);
}

function hideOverlay() {
  const overlay = document.querySelector(".v-modal._1783a4");
  if (overlay) overlay.remove();
}

function createJsonStructure(data) {
  let container = {
    type: "container",
    name: "container",
    content: "elements/shortcutContainer.html",
    parent: {
      selector: "body.ol-cem",
      alternativeSelector: "body.cem-site",
      injectLocation: "afterbegin",
    },
    children: [],
  };

  // Helper function to sanitize section names
  const sanitizeSection = (section) => section.replaceAll(" ", "-");

  // Aggregate shortcuts by section
  let sections = {};
  Object.keys(data.shortcuts).forEach((key) => {
    const shortcut = data.shortcuts[key];
    const sectionName = shortcut.section;

    if (!sections[sectionName]) {
      sections[sectionName] = [];
    }
    sections[sectionName].push({ path: key, name: shortcut.name });
  });

  // Create section structures
  Object.keys(sections).forEach((section) => {
    let sectionStructure = {
      type: "section",
      name: section,
      content: "elements/shortcutSection.html",
      toReplace: [
        { from: "{{Section Id}}", to: sanitizeSection(section) },
        { from: "{{Section Name}}", to: section },
      ],
      parent: {
        selector: "div#paradox-plus-shortcut-section",
        injectLocation: "beforeend",
      },
      children: [],
    };

    // Add children to the section
    sections[section].forEach((shortcut) => {
      sectionStructure.children.push({
        type: "shortcut",
        name: shortcut.name,
        content: "elements/shortcut.html",
        parent: {
          selector: `section#paradox-plus-shortcut-section-${sanitizeSection(
            section
          )} div.menu-content`,
          injectLocation: "beforeend",
        },
        toReplace: [
          { from: "{{PATH}}", to: shortcut.path },
          { from: "{{SHORTCUT_NAME}}", to: shortcut.name },
        ],
      });
    });

    container.children.push(sectionStructure);
  });

  return container;
}

function setupContainerVisibilityToggle() {
  const container = document.querySelector(
    "div#paradox-plus-shortcut-container"
  );
  container.addEventListener("click", toggleShortcutContainer);
}

// Initial setup
injectButton();
injectShortcutContainer()
  .then(setupContainerVisibilityToggle)
  .catch((error) => console.error("Injection failed:", error));

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "updateContainer") {
    document.querySelector("div#paradox-plus-shortcut-container").remove();
    jsonStructure = createJsonStructure(message.data);
    assembleAndInjectHTML(jsonStructure).then(setupContainerVisibilityToggle);
  }
});
