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
  renderActiveShortcut(key, value.name, value.section); // Render the shortcut immediately
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
      console.log("Shortcut removed");

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

// This function renders an active shortcut in the popup
function renderActiveShortcut(path, name, section) {
  console.log(`old path: ${path}`);
  const originalPath = path;
  path = path
    .replaceAll("/", "")
    .replaceAll(" ", "")
    .replaceAll("?", "")
    .replaceAll("&", "")
    .replaceAll("=", "");
  console.log(`new path: ${path}`);
  const activeShortcutsDiv = document.getElementById(
    "active-shortcuts-accordeon"
  );
  const deleteButtonId = `button-delete-${path}`;
  const saveButtonId = `button-save-${path}`;
  const accordeonItemId = `accordion-item-${path}`;

  // Create the accordion item
  const accordionItem = document.createElement("div");
  accordionItem.className = "accordion-item";
  accordionItem.id = accordeonItemId;

  // Replace placeholder with the actual path
  const accordionItemInnerHTML = `
    <h2 class="accordion-header" id="accordion-item-header-${path}">
      <button
        class="accordion-button"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#accordion-item-collapse-${path}"
        aria-expanded="true"
        aria-controls="accordion-item-collapse-${path}"
      >
        ${name}
      </button>
    </h2>
    <div
      id="accordion-item-collapse-${path}"
      class="accordion-collapse collapse"
      aria-labelledby="accordion-item-header-${path}"
      data-bs-parent="#accordionExample"
    >
      <div class="accordion-body">
        <div class="input-group mb-3">
          <span class="input-group-text" id="accordion-item-${path}-input-name">Name</span>
          <input
            type="text"
            class="form-control"
            placeholder="Type a name for this shortcut"
            aria-label="name"
            aria-describedby="accordion-item-${path}-input-name"
            value="${name}"
          />
        </div>
        <div class="input-group mb-3">
          <span class="input-group-text" id="accordion-item-${path}-input-path">Path</span>
          <input
            type="text"
            class="form-control"
            placeholder="CEM's endpoint"
            aria-label="Path"
            aria-describedby="accordion-item-${path}-input-path"
            value="${originalPath}"
            disabled="true"
          />
        </div>
        <div class="input-group mb-3">
          <span class="input-group-text" id="accordion-item-${path}-input-section">section</span>
          <input
            type="text"
            class="form-control"
            placeholder="Which section should contain the shortcut?"
            aria-label="section"
            aria-describedby="accordion-item-${path}-input-section"
            value="${section}"
          />
        </div>
        <button type="submit" class="btn btn-primary btn-save" id="${saveButtonId}" path="${originalPath}" itemId="${accordeonItemId}">Save</button>
      <button type="button" class="btn btn-danger btn-delete" id="${deleteButtonId}" path="${originalPath}" data-item-id="accordion-item-${path}">Delete</button>
      </div>
    </div>
  `;

  // Set the inner HTML of the accordion item
  accordionItem.innerHTML = accordionItemInnerHTML;

  // Append the accordion item to the active shortcuts div
  activeShortcutsDiv.appendChild(accordionItem);

  // Add event listeners if needed, for example, to handle delete button click
  // This can also be done by adding the onclick attribute directly in the button HTML as shown above
  setupDeleteButtons(deleteButtonId);
  setupSaveButtons(saveButtonId);
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
      renderActiveShortcut(key, shortcuts[key].name, shortcuts[key].section);
    });
  });
  setupDeleteButtons();
  setupSaveButtons();
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
        name: selectedText,
        section: "General",
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

  // Now call saveShortcutToStorage with the gathered data
  saveShortcutToStorage(path, { name, section });
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

document.addEventListener("DOMContentLoaded", async function () {
  const processedEndpoints = await fetchEndpoints();

  injectShortcutsIntoSelect(processedEndpoints);
  setupSelectFieldListener();
  loadActiveShortcuts();
});
