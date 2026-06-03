(function () {
  const DEFAULT_SETTINGS = {
    apiBaseUrl: "http://localhost:8000/api",
    apiKey: ""
  };

  const FIELD_LABELS = {
    registration_no: "Số đăng ký",
    owner_name: "Chủ phương tiện",
    address: "Nơi đăng ký",
    province_code: "Tỉnh/TP",
    lmax: "Lmax",
    material: "Vật liệu vỏ",
    inspection_type: "Hình thức kiểm tra",
    inspection_date: "Ngày kiểm tra",
    valid_until: "Hạn đăng kiểm",
    fishing_gear: "Nghề chính"
  };

  const FORM_SELECTORS = {
    registration_no: "#SO_DK",
    owner_name: "#CHU_PHUONG_TIEN",
    address: "#NOI_DANG_KY",
    province_code: "#province_dll",
    lmax: "#KT_CHIEU_DAI",
    material: "#DVAT_LIEU_VOID",
    inspection_type: 'input[name="DLOAI_KIEM_TRA_KTID"]',
    inspection_date: "#NGAY_KIEM_TRA",
    valid_until: "#HAN_DANG_KIEM",
    fishing_gear: "#THAY_DOI_KY_THUAT"
  };

  const PROVINCE_NAME_MAP = {
    QN: "Quảng Ninh",
    TH: "Thanh Hóa",
    NA: "Nghệ An",
    HT: "Hà Tĩnh",
    NB: "Ninh Bình",
    ND: "Nam Định",
    QNG: "Quảng Ngãi",
    QNg: "Quảng Ngãi",
    QT: "Quảng Trị",
    TB: "Thái Bình",
    HY: "Hưng Yên",
    HP: "Hải Phòng",
    CT: "Cà Mau",
    KG: "Kiên Giang",
    BL: "Bạc Liêu",
    ST: "Sóc Trăng"
  };

  const MATERIAL_LABEL_MAP = {
    "Gỗ": "Gỗ",
    "Thép": "Thép",
    FRP: "Vật liệu mới"
  };

  const INSPECTION_RADIO_MAP = {
    hn: "2",
    "tđ": "3",
    dk: "4",
    gs: "3",
    bt: "5",
    "đm": "1",
    lan_dau: "1",
    dong_moi: "1",
    hang_nam: "2",
    tren_da: "3",
    giam_sat: "3",
    dinh_ky: "4",
    bat_thuong: "5",
    cai_hoan: "6"
  };

  const state = {
    settings: null,
    vessel: null,
    panelReady: false
  };

  waitForTarget().then(() => {
    if (window.__FDB_AUTO_FILL_INSTALLED__) {
      return;
    }
    window.__FDB_AUTO_FILL_INSTALLED__ = true;
    install();
    watchDom();
  });

  function install() {
    if (state.panelReady) {
      return;
    }

    const registrationInput = document.querySelector(FORM_SELECTORS.registration_no);
    const searchButton = findSearchButton();
    if (!registrationInput || !searchButton) {
      return;
    }

    state.panelReady = true;
    injectStatusPanel(searchButton, registrationInput);
    hookSearchFlow(registrationInput);
    loadSettingsPreview();
  }

  function watchDom() {
    const observer = new MutationObserver(() => install());
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function injectStatusPanel(searchButton, registrationInput) {
    const row = searchButton.closest(".row") || registrationInput.closest(".row") || registrationInput.parentElement;
    if (!row) {
      return;
    }

    const existing = document.getElementById("fdb-auto-fill-panel");
    if (existing) {
      return;
    }

    const panel = document.createElement("div");
    panel.id = "fdb-auto-fill-panel";
    panel.className = "row";
    panel.style.marginTop = "10px";
    panel.innerHTML = `
      <div class="col-md-12">
        <div class="panel panel-info" style="margin-bottom: 0;">
          <div class="panel-heading" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <strong>Tra cứu từ backend</strong>
            <span class="label label-info">API DOCX</span>
          </div>
          <div class="panel-body">
            <div class="row">
              <div class="col-md-12">
                <p id="fdb-auto-fill-status" style="margin:0 0 8px;color:#666;font-size:12px;">Đang khởi tạo...</p>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12 text-right">
                <button id="fdb-auto-fill-check" class="btn btn-success btn-sm" type="button" style="display:none;">Kiểm tra &amp; Điền</button>
              </div>
            </div>
            <div id="fdb-auto-fill-compare" style="margin-top:10px;"></div>
          </div>
        </div>
      </div>
    `;

    row.parentNode.insertBefore(panel, row.nextSibling);

    const checkButton = panel.querySelector("#fdb-auto-fill-check");
    checkButton.addEventListener("click", handleCheckAndFill);
  }

  function hookSearchFlow(registrationInput) {
    window.tim_kiem_so_dang_ky = async function () {
      await handleSearch();
      return false;
    };

    registrationInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSearch();
      }
    });
  }

  async function handleSearch() {
    const registrationNo = normalizeRegistration(getInputValue(FORM_SELECTORS.registration_no));
    if (!registrationNo) {
      setStatus("Nhập số đăng ký trước khi tìm kiếm.", "error");
      hideCheckButton();
      return;
    }

    const settings = await getSettings();
    if (!settings.apiBaseUrl) {
      setStatus("Chưa cấu hình backend. Hãy mở popup extension để lưu API URL và API key.", "error");
      hideCheckButton();
      return;
    }

    setStatus("Đang gọi backend để tìm dữ liệu...", "loading");

    try {
      const vessel = await findVesselByRegistration(settings, registrationNo);
      if (!vessel) {
        state.vessel = null;
        setStatus(`Không tìm thấy số đăng ký ${registrationNo} trong backend.`, "error");
        hideCheckButton();
        return;
      }

      state.vessel = vessel;
      renderApiSummary(vessel);
      setStatus(`Đã tìm thấy dữ liệu cho ${registrationNo}. Bấm "Kiểm tra & Điền" để so sánh và đổ form.`, "ok");
      showCheckButton();
    } catch (error) {
      setStatus(`Lỗi khi gọi API: ${error.message}`, "error");
      hideCheckButton();
    }
  }

  async function handleCheckAndFill() {
    if (!state.vessel) {
      setStatus("Chưa có dữ liệu API để kiểm tra.", "error");
      return;
    }

    const pageValuesBeforeFill = readFormValues();
    const comparison = buildComparison(state.vessel, pageValuesBeforeFill);

    fillFormValues(state.vessel);
    renderComparison(comparison);

    const matchedCount = comparison.filter(item => item.match).length;
    setStatus(`Đã kiểm tra ${comparison.length} trường, khớp ${matchedCount} trường và đã điền form hiện tại.`, "ok");
  }

  async function findVesselByRegistration(settings, registrationNo) {
    const pageSize = 100;
    let skip = 0;

    while (true) {
      const response = await fetchJson(`${settings.apiBaseUrl}/vessels?skip=${skip}&limit=${pageSize}`, settings.apiKey);
      const items = response.items || [];
      const found = items.find(item => normalizeRegistration(item.reg) === registrationNo);

      if (found) {
        return mapApiVessel(found);
      }

      if (!response.total || skip + items.length >= response.total || items.length < pageSize) {
        return null;
      }

      skip += pageSize;
    }
  }

  function mapApiVessel(item) {
    return {
      registration_no: item.reg || "",
      owner_name: item.owner || "",
      address: item.address || "",
      province_code: item.prov || "",
      lmax: item.lmax ?? "",
      material: item.material || "",
      inspection_type: item.type || "",
      inspection_date: item.date || "",
      valid_until: item.expire || "",
      fishing_gear: item.job || "",
      source_filename: item.source_filename || ""
    };
  }

  function renderApiSummary(vessel) {
    const container = document.getElementById("fdb-auto-fill-compare");
    if (!container) {
      return;
    }

    const summary = [
      ["registration_no", vessel.registration_no],
      ["owner_name", vessel.owner_name],
      ["address", vessel.address],
      ["province_code", getProvinceLabel(vessel.province_code)],
      ["lmax", formatValue(vessel.lmax)],
      ["material", getMaterialLabel(vessel.material)],
      ["inspection_type", getInspectionLabel(vessel.inspection_type)],
      ["inspection_date", formatDateForDisplay(vessel.inspection_date)],
      ["valid_until", formatDateForDisplay(vessel.valid_until)],
      ["fishing_gear", vessel.fishing_gear]
    ];

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-bordered table-condensed" style="margin-bottom:10px;">
          <thead>
            <tr>
              <th style="width:35%;">Trường</th>
              <th>Giá trị API</th>
            </tr>
          </thead>
          <tbody>
            ${summary.map(([key, value]) => `
              <tr>
                <td>${escapeHtml(FIELD_LABELS[key])}</td>
                <td>${escapeHtml(value || "—")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderComparison(items) {
    const container = document.getElementById("fdb-auto-fill-compare");
    if (!container) {
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-bordered table-condensed">
          <thead>
            <tr>
              <th style="width:26%;">Trường</th>
              <th>API</th>
              <th>Form</th>
              <th style="width:10%;">Kết quả</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${escapeHtml(item.label)}</td>
                <td>${escapeHtml(item.apiValue)}</td>
                <td>${escapeHtml(item.pageValue)}</td>
                <td><span class="label ${item.match ? "label-success" : "label-danger"}">${item.match ? "Khớp" : "Lệch"}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function buildComparison(vessel, pageValues) {
    const expectedValues = getExpectedPageValues(vessel);
    const comparisons = [];

    for (const [key, expectedValue] of Object.entries(expectedValues)) {
      if (expectedValue === null || expectedValue === undefined || expectedValue === "") {
        continue;
      }

      const pageValue = pageValues[key] || "";
      const match = normalizeForCompare(expectedValue) === normalizeForCompare(pageValue);
      comparisons.push({
        key,
        label: FIELD_LABELS[key],
        apiValue: expectedValue,
        pageValue: pageValue || "—",
        match
      });
    }

    return comparisons;
  }

  function getExpectedPageValues(vessel) {
    return {
      registration_no: vessel.registration_no,
      owner_name: vessel.owner_name,
      address: vessel.address,
      province_code: getProvinceLabel(vessel.province_code),
      lmax: formatNumber(vessel.lmax),
      material: getMaterialLabel(vessel.material),
      inspection_type: getInspectionLabel(vessel.inspection_type),
      inspection_date: formatDateForDisplay(vessel.inspection_date),
      valid_until: formatDateForDisplay(vessel.valid_until),
      fishing_gear: vessel.fishing_gear
    };
  }

  async function fetchJson(url, apiKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
        headers: {
          Accept: "application/json",
          ...(apiKey ? {
            Authorization: `Bearer ${apiKey}`,
            "X-API-Key": apiKey
          } : {})
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function readFormValues() {
    const result = {};
    result.registration_no = getInputValue(FORM_SELECTORS.registration_no);
    result.owner_name = getInputValue(FORM_SELECTORS.owner_name);
    result.address = getInputValue(FORM_SELECTORS.address);
    result.province_code = getSelectText(FORM_SELECTORS.province_code);
    result.lmax = getInputValue(FORM_SELECTORS.lmax);
    result.material = getSelectText(FORM_SELECTORS.material);
    result.inspection_type = getRadioLabel(FORM_SELECTORS.inspection_type);
    result.inspection_date = getInputValue(FORM_SELECTORS.inspection_date);
    result.valid_until = getInputValue(FORM_SELECTORS.valid_until);
    result.fishing_gear = getInputValue(FORM_SELECTORS.fishing_gear);
    return result;
  }

  function fillFormValues(vessel) {
    setInputValue(FORM_SELECTORS.registration_no, vessel.registration_no);
    setInputValue(FORM_SELECTORS.owner_name, vessel.owner_name);
    setInputValue(FORM_SELECTORS.address, vessel.address);
    setSelectByText(FORM_SELECTORS.province_code, getProvinceLabel(vessel.province_code));
    setInputValue(FORM_SELECTORS.lmax, formatNumber(vessel.lmax));
    setSelectByText(FORM_SELECTORS.material, getMaterialLabel(vessel.material));
    setRadioByValue(FORM_SELECTORS.inspection_type, getInspectionRadioValue(vessel.inspection_type));
    setInputValue(FORM_SELECTORS.inspection_date, formatDateForDisplay(vessel.inspection_date));
    setInputValue(FORM_SELECTORS.valid_until, formatDateForDisplay(vessel.valid_until));
    setInputValue(FORM_SELECTORS.fishing_gear, vessel.fishing_gear || "");
  }

  async function getSettings() {
    const stored = await storageGet(["apiBaseUrl", "apiKey"]);
    return {
      apiBaseUrl: normalizeBaseUrl(stored.apiBaseUrl || DEFAULT_SETTINGS.apiBaseUrl),
      apiKey: stored.apiKey || ""
    };
  }

  async function loadSettingsPreview() {
    state.settings = await getSettings();
    const text = state.settings.apiBaseUrl
      ? `Đã sẵn sàng kết nối backend: ${state.settings.apiBaseUrl}`
      : "Chưa có cấu hình backend. Mở popup extension để lưu URL và API key.";
    setStatus(text, "info");
  }

  function getProvinceLabel(code) {
    if (!code) {
      return "";
    }
    const normalized = code.toString().trim();
    return PROVINCE_NAME_MAP[normalized] || PROVINCE_NAME_MAP[normalized.toUpperCase()] || normalized;
  }

  function getMaterialLabel(value) {
    if (!value) {
      return "";
    }
    const normalized = value.toString().trim();
    if (normalized === "FRP") {
      return "Vật liệu mới";
    }
    return MATERIAL_LABEL_MAP[normalized] || normalized;
  }

  function getInspectionLabel(value) {
    const normalized = value ? value.toString().trim().toUpperCase() : "";
    const labels = {
      HN: "Hàng năm",
      "TĐ": "Trung gian(Trên đà)",
      DK: "Định kỳ",
      GS: "Giám sát",
      BT: "Bất thường",
      "ĐM": "Lần đầu",
      LAN_DAU: "Lần đầu",
      DONG_MOI: "Lần đầu",
      HANG_NAM: "Hàng năm",
      TREN_DA: "Trung gian(Trên đà)",
      GIAM_SAT: "Giám sát",
      DINH_KY: "Định kỳ",
      BAT_THUONG: "Bất thường",
      CAI_HOAN: "Cải hoán"
    };
    return labels[normalized] || value || "";
  }

  function getInspectionRadioValue(value) {
    if (!value) {
      return "";
    }
    const trimmed = value.toString().trim();
    const normalizedKey = trimmed.toLowerCase().replace(/\s+/g, "_");
    const upperValue = trimmed.toUpperCase();
    return INSPECTION_RADIO_MAP[normalizedKey] || INSPECTION_RADIO_MAP[upperValue] || INSPECTION_RADIO_MAP[trimmed] || "";
  }

  function formatDateForDisplay(value) {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value.toString();
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatNumber(value) {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    const number = Number(value);
    if (Number.isNaN(number)) {
      return value.toString();
    }
    return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/\.00$/, "");
  }

  function normalizeRegistration(value) {
    return normalizeText(value).replace(/\s+/g, "");
  }

  function normalizeText(value) {
    return value
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function normalizeForCompare(value) {
    return normalizeText(value).replace(/\s+/g, " ").trim();
  }

  function formatValue(value) {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return value.toString();
  }

  function normalizeBaseUrl(value) {
    return value.trim().replace(/\/+$/, "");
  }

  function setStatus(message, type) {
    const status = document.getElementById("fdb-auto-fill-status");
    if (!status) {
      return;
    }

    const prefixes = {
      loading: "Đang xử lý",
      ok: "Hoàn tất",
      error: "Lỗi",
      info: "Thông báo"
    };

    status.textContent = `${prefixes[type] || "Thông báo"}: ${message}`;
  }

  function showCheckButton() {
    const button = document.getElementById("fdb-auto-fill-check");
    if (button) {
      button.style.display = "inline-block";
    }
  }

  function hideCheckButton() {
    const button = document.getElementById("fdb-auto-fill-check");
    if (button) {
      button.style.display = "none";
    }
  }

  function findSearchButton() {
    return document.querySelector('button[onclick*="tim_kiem_so_dang_ky"]') || document.querySelector("#SO_DK")?.parentElement?.parentElement?.querySelector("button");
  }

  function waitForTarget() {
    return new Promise(resolve => {
      const ready = () => Boolean(document.querySelector(FORM_SELECTORS.registration_no) && findSearchButton());
      if (ready()) {
        resolve();
        return;
      }

      const timer = setInterval(() => {
        if (ready()) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  }

  function getInputValue(selector) {
    const element = document.querySelector(selector);
    return element ? element.value.trim() : "";
  }

  function setInputValue(selector, value) {
    const element = document.querySelector(selector);
    if (!element || value === undefined || value === null || value === "") {
      return false;
    }
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function getSelectText(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      return "";
    }
    const option = element.options[element.selectedIndex];
    return option ? option.textContent.trim() : "";
  }

  function setSelectByText(selector, text) {
    const element = document.querySelector(selector);
    if (!element || !text) {
      return false;
    }

    const normalizedText = normalizeText(text);
    const match = Array.from(element.options).find(option => {
      const optionText = normalizeText(option.textContent);
      return optionText === normalizedText || optionText.includes(normalizedText);
    });

    if (!match) {
      return false;
    }

    element.value = match.value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function getRadioLabel(selector) {
    const checked = document.querySelector(`${selector}:checked`);
    if (!checked) {
      return "";
    }
    const radioLabelMap = {
      "1": "Lần đầu",
      "2": "Hàng năm",
      "3": "Trung gian(Trên đà)",
      "4": "Định kỳ",
      "5": "Bất thường",
      "6": "Cải hoán"
    };
    return radioLabelMap[checked.value] || checked.value || "";
  }

  function setRadioByValue(selector, value) {
    if (!value) {
      return false;
    }
    const radio = document.querySelector(`${selector}[value="${value}"]`);
    if (!radio) {
      return false;
    }
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function storageGet(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  }
})();
