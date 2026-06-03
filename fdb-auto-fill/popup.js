const DEFAULT_SETTINGS = {
  apiBaseUrl: "http://localhost:8000/api",
  apiKey: ""
};

const apiBaseUrlInput = document.getElementById("apiBaseUrl");
const apiKeyInput = document.getElementById("apiKey");
const statusEl = document.getElementById("status");

init();

document.getElementById("saveSettings").addEventListener("click", saveSettings);
document.getElementById("applyToTab").addEventListener("click", applyToCurrentTab);

async function init() {
  const stored = await storageGet(["apiBaseUrl", "apiKey"]);
  apiBaseUrlInput.value = stored.apiBaseUrl || DEFAULT_SETTINGS.apiBaseUrl;
  apiKeyInput.value = stored.apiKey || "";
}

async function saveSettings() {
  const apiBaseUrl = normalizeBaseUrl(apiBaseUrlInput.value);
  const apiKey = apiKeyInput.value.trim();

  if (!isAllowedApiUrl(apiBaseUrl)) {
    setStatus("Backend URL phải là localhost hoặc domain tongcucthuysan.gov.vn.", "error");
    return;
  }

  await storageSet({ apiBaseUrl, apiKey });
  setStatus("Đã lưu cấu hình API cục bộ.", "ok");
}

async function applyToCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      setStatus("Không tìm thấy tab hiện tại.", "error");
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    setStatus("Đã gắn extension vào tab hiện tại.", "ok");
  } catch (error) {
    setStatus(`Không thể gắn vào tab hiện tại: ${error.message}`, "error");
  }
}

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

function isAllowedApiUrl(value) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    return isLocalhost || url.hostname.endsWith("tongcucthuysan.gov.vn");
  } catch {
    return false;
  }
}

function setStatus(message, type) {
  const prefix = {
    ok: "Hoàn tất",
    error: "Lỗi"
  }[type] || "Thông báo";

  statusEl.textContent = `${prefix}: ${message}`;
}

function storageGet(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

function storageSet(items) {
  return new Promise(resolve => chrome.storage.local.set(items, resolve));
}
