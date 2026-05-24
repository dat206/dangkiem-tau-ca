const SELECTORS = {
  searchButton: "ENTER_SELECTOR_NUT_TIM_KIEM",
  registrationInput: "ENTER_SELECTOR_INPUT_SO_DK",
  searchResultAnchor: "ENTER_SELECTOR_KET_QUA_TIM_KIEM",
  compareFields: {
    ownerName: "ENTER_SELECTOR_OWNER_NAME",
    dateOfBirth: "ENTER_SELECTOR_DATE_OF_BIRTH"
  },
  autofillFields: {
    address: "ENTER_SELECTOR_ADDRESS",
    phoneNumber: "ENTER_SELECTOR_PHONE",
    dossierContent: "ENTER_SELECTOR_DOSSIER_CONTENT"
  }
};

const FIELD_CANDIDATES = {
  registrationNumber: ["registration_number", "so_dang_ky"],
  ownerName: ["owner_name", "ho_ten"],
  dateOfBirth: ["date_of_birth", "ngay_sinh"],
  address: ["address", "dia_chi"],
  phoneNumber: ["phone_number", "so_dien_thoai", "phone"],
  dossierContent: ["dossier_content", "noi_dung_ho_so"]
};

const STATE = {
  lastRegistrationNumber: "",
  lastApiData: null
};

function isSelectorConfigured(selector) {
  return typeof selector === "string" && selector.trim() && !selector.includes("ENTER_SELECTOR");
}

function queryBySelector(selector, root = document) {
  if (!isSelectorConfigured(selector)) {
    return null;
  }

  try {
    return root.querySelector(selector);
  } catch (error) {
    console.warn("[VNF Auto Crosscheck] Selector không hợp lệ:", selector, error);
    return null;
  }
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function getValueFromElement(element) {
  if (!element) {
    return "";
  }

  if ("value" in element) {
    return normalizeText(element.value);
  }

  return normalizeText(element.textContent);
}

function setNativeValue(element, value) {
  const nextValue = value == null ? "" : String(value);
  const descriptor = Object.getOwnPropertyDescriptor(element.constructor.prototype, "value");

  if (descriptor?.set) {
    descriptor.set.call(element, nextValue);
  } else {
    element.value = nextValue;
  }

  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function markFieldMismatch(element, message) {
  if (!element) {
    return;
  }

  element.dataset.vnfCrosscheckStatus = "mismatch";
  element.style.border = "2px solid #d93025";
  element.style.backgroundColor = "#fff3f1";
  if (message) {
    element.title = message;
  }
}

function clearFieldHighlight(element) {
  if (!element) {
    return;
  }

  element.dataset.vnfCrosscheckStatus = "";
  element.style.border = "";
  element.style.backgroundColor = "";
  element.title = "";
}

function pickApiValue(apiData, fieldName) {
  const candidates = FIELD_CANDIDATES[fieldName] || [];

  for (const key of candidates) {
    if (apiData[key] != null && apiData[key] !== "") {
      return apiData[key];
    }
  }

  return null;
}

function validateApiData(apiData) {
  if (!apiData || typeof apiData !== "object" || Array.isArray(apiData)) {
    throw new Error("Dữ liệu API không hợp lệ.");
  }

  const registration = pickApiValue(apiData, "registrationNumber");
  if (!registration) {
    throw new Error("Dữ liệu API thiếu số đăng ký.");
  }

  return apiData;
}

function ensureActionButton(anchorElement) {
  if (!anchorElement) {
    throw new Error("Không tìm thấy nút Tìm kiếm để chèn nút đối soát.");
  }

  let button = document.getElementById("vnf-crosscheck-button");
  if (button) {
    return button;
  }

  button = document.createElement("button");
  button.id = "vnf-crosscheck-button";
  button.type = "button";
  button.textContent = "Kiểm tra & Đối soát";
  button.style.marginLeft = "8px";
  button.style.padding = "6px 12px";
  button.style.border = "1px solid #0b57d0";
  button.style.borderRadius = "4px";
  button.style.background = "#0b57d0";
  button.style.color = "#fff";
  button.style.cursor = "pointer";
  button.style.fontSize = "13px";
  button.style.lineHeight = "1.2";

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Đang kiểm tra...";

    try {
      await compareAndAutofill();
      button.textContent = "Đã đối soát";
    } catch (error) {
      button.textContent = "Kiểm tra & Đối soát";
      alert(error.message || "Không thể đối soát dữ liệu.");
    } finally {
      button.disabled = false;
    }
  });

  anchorElement.insertAdjacentElement("afterend", button);
  return button;
}

async function waitForSearchResults() {
  const timeoutMs = 10000;
  const intervalMs = 300;
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const timer = window.setInterval(() => {
      const resultAnchor = queryBySelector(SELECTORS.searchResultAnchor);

      if (resultAnchor) {
        clearInterval(timer);
        resolve(resultAnchor);
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer);
        reject(new Error("Không tìm thấy vùng kết quả sau khi bấm Tìm kiếm. Hãy cập nhật selector kết quả."));
      }
    }, intervalMs);
  });
}

async function fetchApiDataByRegistration(registrationNumber) {
  const response = await chrome.runtime.sendMessage({
    type: "FETCH_VESSEL_DATA",
    registrationNumber
  });

  if (!response?.ok) {
    throw new Error(response?.error || "Không lấy được dữ liệu từ API.");
  }

  return validateApiData(response.data);
}

async function compareAndAutofill() {
  const apiData = STATE.lastApiData;
  if (!apiData) {
    throw new Error("Chưa có dữ liệu API để đối soát.");
  }

  const mismatchMessages = [];

  for (const [fieldName, selector] of Object.entries(SELECTORS.compareFields)) {
    const element = queryBySelector(selector);
    if (!element) {
      continue;
    }

    clearFieldHighlight(element);
    const webValue = getValueFromElement(element);
    const apiValue = normalizeText(pickApiValue(apiData, fieldName));

    if (apiValue && webValue && apiValue !== webValue) {
      const message = `Không khớp ${fieldName}: web="${webValue}" / api="${apiValue}"`;
      markFieldMismatch(element, message);
      mismatchMessages.push(message);
    }
  }

  for (const [fieldName, selector] of Object.entries(SELECTORS.autofillFields)) {
    const element = queryBySelector(selector);
    if (!element) {
      continue;
    }

    clearFieldHighlight(element);
    const nextValue = pickApiValue(apiData, fieldName);
    if (nextValue != null) {
      setNativeValue(element, nextValue);
    }
  }

  if (mismatchMessages.length > 0) {
    alert(`Phát hiện ${mismatchMessages.length} trường không khớp.\n${mismatchMessages.join("\n")}`);
  }
}

async function handleSearchClick() {
  const registrationInput = queryBySelector(SELECTORS.registrationInput);
  if (!registrationInput) {
    alert("Không tìm thấy ô Số đăng ký. Hãy cập nhật selector trong content.js.");
    return;
  }

  const registrationNumber = getValueFromElement(registrationInput);
  if (!registrationNumber) {
    alert("Chưa nhập Số đăng ký.");
    return;
  }

  STATE.lastRegistrationNumber = registrationNumber;
  STATE.lastApiData = null;

  try {
    await waitForSearchResults();
    STATE.lastApiData = await fetchApiDataByRegistration(registrationNumber);
    ensureActionButton(queryBySelector(SELECTORS.searchButton));
  } catch (error) {
    alert(error.message || "Không thể chuẩn bị dữ liệu đối soát.");
  }
}

function attachSearchButtonListener(button) {
  if (!button || button.dataset.vnfCrosscheckBound === "true") {
    return;
  }

  button.dataset.vnfCrosscheckBound = "true";
  button.addEventListener("click", () => {
    window.setTimeout(() => {
      handleSearchClick().catch((error) => {
        console.error("[VNF Auto Crosscheck]", error);
      });
    }, 0);
  });
}

function bootstrap() {
  const searchButton = queryBySelector(SELECTORS.searchButton);
  attachSearchButtonListener(searchButton);
}

const observer = new MutationObserver(() => {
  bootstrap();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

bootstrap();
