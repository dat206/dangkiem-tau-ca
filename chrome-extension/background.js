const DEFAULT_SETTINGS = {
  apiBaseUrl: "http://localhost:8000",
  apiPathTemplate: "/api/extension/vessels/{registrationNumber}",
  authToken: "",
  requestTimeoutMs: 15000
};

function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function buildApiUrl(apiBaseUrl, apiPathTemplate, registrationNumber) {
  const normalizedBaseUrl = normalizeBaseUrl(apiBaseUrl);
  const normalizedRegistration = encodeURIComponent(String(registrationNumber || "").trim());
  const path = String(apiPathTemplate || "")
    .trim()
    .replace("{registrationNumber}", normalizedRegistration);

  if (!normalizedBaseUrl) {
    throw new Error("Chưa cấu hình API Base URL trong Options của extension.");
  }

  if (!path.startsWith("/")) {
    throw new Error("API path template phải bắt đầu bằng dấu '/'.");
  }

  return `${normalizedBaseUrl}${path}`;
}

async function getSettings() {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...stored
  };
}

async function fetchVesselData(registrationNumber) {
  const settings = await getSettings();
  const token = String(settings.authToken || "").trim();

  if (!token) {
    throw new Error("Chưa cấu hình token truy cập API trong Options của extension.");
  }

  const url = buildApiUrl(settings.apiBaseUrl, settings.apiPathTemplate, registrationNumber);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Number(settings.requestTimeoutMs) || 15000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      signal: controller.signal
    });

    const rawText = await response.text();
    let payload = null;

    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch (error) {
        throw new Error("API trả về dữ liệu không phải JSON hợp lệ.");
      }
    }

    if (!response.ok) {
      const detail = payload?.detail || payload?.message || response.statusText;
      throw new Error(`API lỗi ${response.status}: ${detail}`);
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("API không trả về object dữ liệu hợp lệ.");
    }

    return {
      ok: true,
      data: payload,
      meta: {
        url,
        status: response.status
      }
    };
  } catch (error) {
    const message = error?.name === "AbortError"
      ? "Yêu cầu API quá thời gian chờ."
      : (error?.message || "Không gọi được API.");

    return {
      ok: false,
      error: message
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GET_EXTENSION_SETTINGS") {
    getSettings()
      .then((settings) => sendResponse({ ok: true, settings }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "FETCH_VESSEL_DATA") {
    fetchVesselData(message.registrationNumber)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});
