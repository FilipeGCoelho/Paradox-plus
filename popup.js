let accordeon_prefix = "active-shortcuts-accordeon";

// This function sets up the search input listener
function injectShortcutsIntoSelect(processedEndpoints) {
  const selectElement = document.querySelector(".form-select");

  // Add shortcuts as options to the select element
  processedEndpoints.forEach((endpoint) => {
    const option = document.createElement("option");
    option.textContent = endpoint[1];
    option.value = endpoint[0];
    selectElement.appendChild(option);
  });
}

// This function filters the endpoints based on the search query
function filterEndpoints(query, processedEndpoints) {
  if (!query) {
    return Object.keys(processedEndpoints); // Return all if query is empty
  }
  return Object.keys(processedEndpoints).filter((endpoint) =>
    processedEndpoints[endpoint].toLowerCase().includes(query)
  );
}

// This function adds an active shortcut and saves it to local storage
function addActiveShortcut(key, value) {
  renderActiveShortcut(key, value.encodedName, value.encodedSection); // Render the shortcut immediately
  saveShortcutToStorage(key, value); // Save the shortcut to storage

  // Disable the selected option in the dropdown
  const selectElement = document.querySelector(".form-select");
  const optionToDisable = selectElement.querySelector(`option[value="${key}"]`);
  if (optionToDisable) {
    optionToDisable.disabled = true;
  }
}

function deleteShortcut(key) {
  chrome.storage.local.get({ shortcuts: {} }, function (data) {
    const shortcuts = data.shortcuts;
    delete shortcuts[key]; // Remove the shortcut
    chrome.storage.local.set({ shortcuts }, function () {
      // Re-enable the option in the dropdown
      const selectElement = document.querySelector(".form-select");
      const optionToEnable = selectElement.querySelector(
        `option[value="${key}"]`
      );
      if (optionToEnable) {
        optionToEnable.disabled = false;
      }

      // Remove the accordion item
      const itemToDelete = document.getElementById(`accordion-item-${key}`);
      if (itemToDelete) {
        itemToDelete.remove();
      }

      updateShortcutContainer();
    });
  });
}

function renderActiveShortcut(path, encodedName, encodedSection) {
  const originalPath = path;
  const sanitizedPath = sanitizePath(path);

  const shortcutSectionElement =
    getCorrectShortcutSectionContainer(encodedSection);

  const deleteButtonId = `button-delete-${sanitizedPath}`;
  const saveButtonId = `button-save-${sanitizedPath}`;
  const accordeonItemId = `accordion-item-${sanitizedPath}`;
  const shortcutNameInputId = `name-input-${sanitizedPath}`;
  const shortcutSectionInputId = `section-input-${sanitizedPath}`;

  // Create accordion item and sub-elements
  const accordionItem = createAccordionItem(sanitizedPath);
  const accordionHeader = createAccordionHeader(sanitizedPath, encodedName);
  const accordionCollapse = createAccordionCollapse(sanitizedPath);
  const accordionBody = document.createElement("div");
  accordionBody.className = "accordion-body";

  // Create inputs
  const nameInput = createInputField(
    (labelText = "Name"),
    (placeholder = "Type a name for this shortcut"),
    (ariaLabel = "name"),
    (ariaDescribedby = `${shortcutNameInputId}-input-name`),
    (id = shortcutNameInputId),
    (value = decodeURIComponent(encodedName))
  );
  const pathInput = createInputField(
    (labelText = "Path"),
    (placeholder = "CEM's endpoint"),
    (ariaLabel = "Path"),
    (ariaDescribedby = `accordion-item-${sanitizedPath}-input-path`),
    (id = null),
    (value = originalPath),
    (isDisabled = true)
  );
  const sectionInput = createInputField(
    (labelText = "section"),
    (placeholder = "Which section should contain the shortcut?"),
    (ariaLabel = "section"),
    (ariaDescribedby = `${shortcutSectionInputId}-input-section`),
    (id = shortcutSectionInputId),
    (value = decodeURIComponent(encodedSection))
  );

  // Create Save button
  const saveButtonAttributes = {
    type: "submit",
    path: originalPath,
    itemId: accordeonItemId,
  };
  const saveButton = createButton(
    "Save",
    "btn btn-primary btn-save",
    saveButtonId,
    saveButtonAttributes
  );

  // Create Delete button
  const deleteButtonAttributes = {
    type: "button",
    path: originalPath,
    "data-item-id": `accordion-item-${sanitizedPath}`,
  };
  const deleteButton = createButton(
    "Delete",
    "btn btn-danger btn-delete",
    deleteButtonId,
    deleteButtonAttributes
  );

  // Append elements
  accordionBody.append(
    nameInput,
    pathInput,
    sectionInput,
    saveButton,
    deleteButton
  );
  accordionCollapse.appendChild(accordionBody);
  accordionItem.append(accordionHeader, accordionCollapse);
  shortcutSectionElement.appendChild(accordionItem);

  // Setup event listeners
  setupDeleteButtons(deleteButtonId);
  setupSaveButtons(saveButtonId);
  setupInputFieldBehavior(
    saveButtonId,
    shortcutNameInputId,
    shortcutSectionInputId
  );
}

function sanitizePath(path) {
  return path.replace(/[\/ ?&=_-]/g, "");
}

function createAccordionItem(sanitizedPath) {
  const accordionItem = document.createElement("div");
  accordionItem.className = "accordion-item";
  accordionItem.id = `accordion-item-${sanitizedPath}`;
  return accordionItem;
}

function createAccordionHeader(sanitizedPath, encodedName) {
  const accordionHeader = document.createElement("h2");
  accordionHeader.className = "accordion-header";
  accordionHeader.id = `accordion-item-header-${sanitizedPath}`;

  const headerButton = document.createElement("button");
  headerButton.className = "accordion-button";
  headerButton.setAttribute("type", "button");
  headerButton.setAttribute("data-bs-toggle", "collapse");
  headerButton.setAttribute(
    "data-bs-target",
    `#accordion-item-collapse-${sanitizedPath}`
  );
  headerButton.setAttribute("aria-expanded", "true");
  headerButton.setAttribute(
    "aria-controls",
    `accordion-item-collapse-${sanitizedPath}`
  );
  headerButton.textContent = decodeURIComponent(encodedName);

  accordionHeader.appendChild(headerButton);
  return accordionHeader;
}

function createAccordionCollapse(sanitizedPath) {
  const accordionCollapse = document.createElement("div");
  accordionCollapse.id = `accordion-item-collapse-${sanitizedPath}`;
  accordionCollapse.className = "accordion-collapse collapse";
  accordionCollapse.setAttribute(
    "aria-labelledby",
    `accordion-item-header-${sanitizedPath}`
  );
  accordionCollapse.setAttribute("data-bs-parent", "#accordionExample");
  return accordionCollapse;
}

function createInputField(
  labelText,
  placeholder,
  ariaLabel,
  ariaDescribedby,
  id,
  value,
  isDisabled = false
) {
  const inputGroup = document.createElement("div");
  inputGroup.className = "input-group mb-3";

  const span = document.createElement("span");
  span.className = "input-group-text";
  span.textContent = labelText;

  const input = document.createElement("input");
  input.type = "text";
  input.className = "form-control";
  input.placeholder = placeholder;
  input.setAttribute("aria-label", ariaLabel);
  if (ariaDescribedby) input.setAttribute("aria-describedby", ariaDescribedby);
  input.value = value;
  if (id) input.id = id;
  if (isDisabled) input.disabled = true;

  inputGroup.append(span, input);
  return inputGroup;
}

function createButton(buttonText, className, id, additionalAttributes) {
  const button = document.createElement("button");
  button.textContent = buttonText;
  button.className = className;
  button.id = id;

  // Set additional attributes if provided
  if (additionalAttributes) {
    Object.keys(additionalAttributes).forEach((key) => {
      button.setAttribute(key, additionalAttributes[key]);
    });
  }

  return button;
}

// This function saves the shortcut to local storage
function saveShortcutToStorage(key, value) {
  chrome.storage.local.get({ shortcuts: {} }, function (data) {
    const shortcuts = data.shortcuts;
    shortcuts[key] = value;
    chrome.storage.local.set({ shortcuts }, function () {
      updateShortcutContainer();
    });
  });
}

// This function loads the active shortcuts from local storage
function loadActiveShortcuts() {
  chrome.storage.local.get({ shortcuts: {} }, function (data) {
    const shortcuts = data.shortcuts;
    Object.keys(shortcuts).forEach((key) => {
      renderActiveShortcut(
        key,
        shortcuts[key].encodedName,
        shortcuts[key].encodedSection
      );
    });
  });
}

// This function fetches the endpoints from the CSV file
async function fetchEndpoints() {
  const response = await fetch("resources/active-website-endpoints.csv");
  const data = await response.text();
  const rows = data.split("\n").map((row) => row.trim());
  return preprocessEndpoints(rows);
}

// This function preprocesses endpoints to ensure uniqueness
function preprocessEndpoints(rows) {
  return rows.map((row) => row.split(","));
}

function setupSelectFieldListener() {
  const selectElement = document.querySelector(".form-select");
  selectElement.addEventListener("change", function (event) {
    const option = event.target.selectedOptions[0];
    const selectedValue = option.value;
    const selectedText = option.text;

    // Assuming addActiveShortcut function takes the value of the selected option
    if (selectedValue !== "Activate a shortcut") {
      // Assuming "default" is the value of your default option
      addActiveShortcut(selectedValue, {
        encodedName: encodeURIComponent(selectedText),
        encodedSection: encodeURIComponent("General"),
      });

      // Reset the select field to the default option
      this.value = "Activate a shortcut";
    }
  });
}

function setupDeleteButtons(id) {
  const deleteButtons = document.querySelectorAll(
    id ? `#${id}` : "button.btn-delete"
  );
  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const itemId = this.getAttribute("data-item-id");
      const itemToDelete = document.getElementById(itemId);
      if (itemToDelete) {
        itemToDelete.remove();
        deleteShortcut(this.getAttribute("path"));
      }
    });
  });
}

function setupSaveButtons(id) {
  const saveButtons = document.querySelectorAll(
    id ? `#${id}` : "button.btn-save"
  );
  saveButtons.forEach((button) => {
    button.addEventListener("click", handleSubmitButton);
  });
}

function setupInputFieldBehavior(submitInputId, nameInputId, sectionInputId) {
  [nameInputId, sectionInputId]
    .map((id) => document.getElementById(id))
    .forEach((element) => {
      element.addEventListener("keyup", (event) => {
        if (event.key === "Enter" || event.keyCode === 13) {
          document.getElementById(submitInputId).click();
        }
      });
    });
}

function getCorrectShortcutSectionContainer(encodedSection) {
  const activeShortcutsDiv = document.getElementById(accordeon_prefix);

  const shortcutContainerID = `${accordeon_prefix}-${encodedSection}`;
  let shortcutSectionElement = document.getElementById(shortcutContainerID);

  if (!shortcutSectionElement) {
    let newShortcutContainer = createShortcutContainer(
      (id = shortcutContainerID),
      (section = decodeURIComponent(encodedSection))
    );
    activeShortcutsDiv.appendChild(newShortcutContainer);
    shortcutSectionElement = document.getElementById(shortcutContainerID);

    //setup the self-destruction behavior, in case the number of children/shortcuts is 0
    const activeShortcutsDivObserver = new MutationObserver(
      (mutationList, observer) => {
        if (
          mutationList.filter(
            (mutation) => mutation.target === shortcutSectionElement
          ).length > 0
        ) {
          let elementToDelete = document.getElementById(shortcutContainerID);
          if (elementToDelete.childElementCount < 2) {
            elementToDelete.remove();
          }
        }
      }
    );
    activeShortcutsDivObserver.observe(activeShortcutsDiv, {
      childList: true,
      subtree: true,
    });
  }

  return shortcutSectionElement;
}

function handleSubmitButton(event) {
  let itemId = event.target.getAttribute("itemId");
  let path = event.target.getAttribute("path");

  const nameInput = document.querySelector(
    `div#${itemId} input[aria-label="name"]`
  );
  const sectionInput = document.querySelector(
    `div#${itemId} input[aria-label="section"]`
  );

  const name = nameInput.value;
  const section = sectionInput.value;

  const container = document.querySelector(`#${itemId} div.accordion-collapse`);
  container?.classList.remove("show");
  container.closest("div.accordion-item").remove();
  // Render updated shortcut, and save on the local storage
  addActiveShortcut(path, {
    encodedName: encodeURIComponent(name),
    encodedSection: encodeURIComponent(section),
  });
}

function updateShortcutContainer() {
  chrome.storage.local.get({ shortcuts: {} }, function (data) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "updateContainer",
        data,
      });
    });
  });
}

function createShortcutContainer(id, section) {
  let container = document.createElement("div");
  container.id = id;
  container.classList.add(`${accordeon_prefix}-section`);

  let h4 = document.createElement("h4");
  h4.textContent = section;
  container.appendChild(h4);

  return container;
}

document.addEventListener("DOMContentLoaded", async function () {
  accordeon_prefix = "active-shortcuts-accordeon";
  const processedEndpoints = await fetchEndpoints();

  injectShortcutsIntoSelect(processedEndpoints);
  setupSelectFieldListener();
  loadActiveShortcuts();
});
