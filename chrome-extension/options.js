const DEFAULT_SETTINGS = {
  apiBaseUrl: "http://localhost:8000",
  apiPathTemplate: "/api/extension/vessels/{registrationNumber}",
  authToken: "",
  requestTimeoutMs: 15000
};

async function restoreOptions() {
  const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);

  document.getElementById("apiBaseUrl").value = settings.apiBaseUrl || "";
  document.getElementById("apiPathTemplate").value = settings.apiPathTemplate || "";
  document.getElementById("authToken").value = settings.authToken || "";
  document.getElementById("requestTimeoutMs").value = settings.requestTimeoutMs || 15000;
}

async function saveOptions(event) {
  event.preventDefault();

  const apiBaseUrl = document.getElementById("apiBaseUrl").value.trim();
  const apiPathTemplate = document.getElementById("apiPathTemplate").value.trim();
  const authToken = document.getElementById("authToken").value.trim();
  const requestTimeoutMs = Number(document.getElementById("requestTimeoutMs").value || 15000);
  const status = document.getElementById("status");

  if (!apiBaseUrl) {
    status.textContent = "API Base URL không được để trống.";
    return;
  }

  if (!apiPathTemplate.startsWith("/") || !apiPathTemplate.includes("{registrationNumber}")) {
    status.textContent = "API path template phải bắt đầu bằng '/' và chứa {registrationNumber}.";
    return;
  }

  await chrome.storage.local.set({
    apiBaseUrl,
    apiPathTemplate,
    authToken,
    requestTimeoutMs
  });

  status.textContent = "Đã lưu cấu hình.";
  window.setTimeout(() => {
    status.textContent = "";
  }, 2500);
}

document.getElementById("settings-form").addEventListener("submit", saveOptions);
restoreOptions().catch((error) => {
  document.getElementById("status").textContent = error.message;
});
