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
  const sanitizeSection = (section) =>
    section
      .replaceAll(" ", "-")
      .replaceAll("\\", "")
      .replaceAll("%", "")
      .replaceAll("?", "")
      .replaceAll("&", "")
      .replaceAll("=", "")
      .replaceAll("_", "")
      .replaceAll("!", "")
      .replaceAll("-", "");

  // Aggregate shortcuts by section
  let sections = {};
  Object.keys(data.shortcuts).forEach((key) => {
    const shortcut = data.shortcuts[key];
    const sectionName = shortcut.encodedSection;

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
        { from: "{{Section Name}}", to: decodeURIComponent(section) },
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

function injectScript(file_path, tag) {
  var node = document.getElementsByTagName(tag)[0];
  var script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file_path);
  node.appendChild(script);
}

async function getLeadIDCompanyID(host, OID) {
  const url = `https://${host}/api/lead/${OID}?lead_type=all-candidates&support_auto_translation=1&no_perm_raise=0&selected=72036861588764&include_ui_filter=-1&order_type=0&filter_data=&with_candidate_summary_data=1&with_integration_message=1`;
  const requestData = {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9,pt;q=0.8",
      Baggage:
        "sentry-trace_id=ff83d346ab0e46f89c8de070b721063e,sentry-environment=Stg,sentry-release=app%402.3.2,sentry-public_key=4931187b1d434611ac72872a9547f7c4,sentry-transaction=%2Fcandidates%2F.*,sentry-sample_rate=0.05",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      Pragma: "no-cache",
      "Sec-CH-UA":
        '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": '"macOS"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "Sentry-Trace": "ff83d346ab0e46f89c8de070b721063e-b9ad17b891a526f3-0",
      "X-CSRFToken":
        "QUyv4xsjIsOllgFluPqVMfKhr7SFbO96PjlGFg5EBCu9nbFoEqGnnTiRdFjx4f81",
      "X-Requested-With": "XMLHttpRequest",
    },
    referrer: "https://stg.paradox.ai/candidates/all-candidates",
    referrerPolicy: "same-origin",
    mode: "cors",
    credentials: "include",
  };

  try {
    const response = await fetch(url, requestData);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return { leadId: data.lead.raw_id, companyId: data.company_id };
  } catch (error) {
    console.error("Error making the request:", error);
  }
}

function injectLeadId() {
  if (location?.pathname?.startsWith("/candidates/")) {
    const OID = location.search.split("selected=")[1].split("&")[0];
    const HOST = location.host;

    getLeadIDCompanyID(HOST, OID).then((response) => {
      const idElementToInject = "lead-id";
      const toInject = document.querySelector(`#${idElementToInject}`);
      if (toInject) {
        toInject.innerHTML = `<b>Lead Id: </b>${response.leadId}`;
      } else {
        const targetElement = document.querySelector("div#board-profile");
        if (targetElement) {
          // Create the new element
          const newElement = document.createElement("div");
          newElement.id = "lead-id";
          newElement.innerHTML = `<b>Lead Id: </b>${response.leadId}`;

          // Insert the new element as the first child of the target
          if (targetElement.firstChild) {
            targetElement.insertBefore(newElement, targetElement.firstChild);
          } else {
            targetElement.appendChild(newElement);
          }
        } else {
          console.log("Lead Id injection target not found");
        }
      }
    });
  }
}

function injectCompanyIdAndLeadId() {
  if (location?.pathname?.startsWith("/candidates/")) {
    const OID = location.search.split("selected=")[1].split("&")[0];
    const HOST = location.host;

    getLeadIDCompanyID(HOST, OID).then((response) => {
      const innerHTML = `<span><span><b>Company ID: </b>${response.companyId}</span></span>`;
      const toInject = document.querySelector(`div#company-id`);
      if (toInject) {
        toInject.innerHTML = innerHTML;
      } else {
        const targetElement = document.querySelector(
          `div[data-testid="header_lbl_company_name"]`
        );
        if (targetElement) {
          // Create the new element
          const newElement = document.createElement("div");
          newElement.id = "company-id";
          newElement.innerHTML = innerHTML;

          // Insert the new element as the first child of the target
          targetElement.insertAdjacentElement("beforebegin", newElement);
        } else {
          console.log("Company Id injection target not found");
        }
      }
    });
  }
}

// Function to check for the target element and set up MutationObserver
function checkAndObserveTarget() {
  const leadTarget = document.querySelector(
    'strong[data-testid="candidateprofile_lbl_name"]'
  );

  if (leadTarget) {
    console.log("LeadTarget element found. Setting up MutationObserver.");

    // Create an observer instance
    const leadObserver = new MutationObserver(injectLeadId);

    // Observer configuration
    leadObserver.observe(leadTarget, {
      characterData: true,
      subtree: true,
    });

    // Clear the interval as the target is found and observer is set
    injectLeadId();
  }

  const companyTarget = document.querySelector(
    'div[data-testid="header_lbl_company_name"] span span'
  );

  if (companyTarget) {
    console.log("CompanyTarget element found. Setting up MutationObserver.");

    // Create an observer instance
    const companyObserver = new MutationObserver(injectCompanyIdAndLeadId);

    // Observer configuration
    companyObserver.observe(companyTarget, {
      characterData: true,
      subtree: true,
    });

    // Clear the interval as the target is found and observer is set
    injectCompanyIdAndLeadId();
  }

  if (leadTarget && companyTarget) clearInterval(checkInterval);
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

// Set an interval to check for the target element
const checkInterval = setInterval(checkAndObserveTarget, 1000); // checks every 1000 milliseconds (1 second)
