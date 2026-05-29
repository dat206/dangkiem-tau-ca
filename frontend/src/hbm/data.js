// data.js — mock data, palette helpers, formatters

export const PROVINCES = [
  { code: "QN",  name: "Quảng Ninh",  count: 84 },
  { code: "HP",  name: "Hải Phòng",   count: 51 },
  { code: "TB",  name: "Thái Bình",   count: 19 },
  { code: "NĐ",  name: "Nam Định",    count: 22 },
  { code: "TH",  name: "Thanh Hóa",   count: 31 },
  { code: "NA",  name: "Nghệ An",     count: 28 },
  { code: "HT",  name: "Hà Tĩnh",     count: 12 },
  { code: "QB",  name: "Quảng Bình",  count: 18 },
  { code: "QT",  name: "Quảng Trị",   count: 9  },
  { code: "ĐN",  name: "Đà Nẵng",     count: 24 },
  { code: "QNg", name: "Quảng Ngãi",  count: 33 },
  { code: "BĐ",  name: "Bình Định",   count: 41 },
  { code: "KH",  name: "Khánh Hòa",   count: 47 },
  { code: "NT",  name: "Ninh Thuận",  count: 14 },
  { code: "BT",  name: "Bình Thuận",  count: 39 },
];

export const VESSELS = [
  ["QN-90599-TS", "Nguyễn Văn An",    "Cẩm Phả, Quảng Ninh",        "QN",  18.5, "Gỗ",  "ĐK", "12/04/2026", "12/04/2027", "Lưới rê"],
  ["QN-90523-TS", "Trần Thị Bích",     "Vân Đồn, Quảng Ninh",        "QN",  15.2, "Gỗ",  "HN", "10/04/2026", "10/04/2027", "Câu vàng"],
  ["HP-12048-TS", "Lê Quang Cường",    "Đồ Sơn, Hải Phòng",          "HP",  22.0, "Thép","TĐ", "08/04/2026", "08/10/2027", "Lưới kéo"],
  ["HP-12110-TS", "Phạm Minh Dũng",    "Cát Hải, Hải Phòng",         "HP",  19.8, "Gỗ",  "ĐK", "07/04/2026", "07/04/2027", "Lưới rê"],
  ["TH-77512-TS", "Hoàng Văn Em",      "Sầm Sơn, Thanh Hóa",         "TH",  13.6, "Gỗ",  "HN", "05/04/2026", "05/04/2027", "Câu"],
  ["TH-77840-TS", "Vũ Thị Phương",     "Hậu Lộc, Thanh Hóa",         "TH",  16.4, "FRP", "GS", "03/04/2026", "03/10/2026", "Lưới vây"],
  ["NA-65021-TS", "Đặng Hữu Giang",    "Cửa Lò, Nghệ An",            "NA",  21.5, "Thép","ĐK", "02/04/2026", "02/04/2027", "Lưới kéo đôi"],
  ["NA-65199-TS", "Bùi Văn Hùng",      "Quỳnh Lưu, Nghệ An",         "NA",  17.2, "Gỗ",  "HN", "30/03/2026", "30/03/2027", "Câu vàng"],
  ["HT-44087-TS", "Ngô Thanh Hà",      "Thạch Hà, Hà Tĩnh",          "HT",  14.0, "Gỗ",  "GS", "28/03/2026", "28/09/2026", "Lưới rê"],
  ["QB-31290-TS", "Phan Văn Khôi",     "Bố Trạch, Quảng Bình",       "QB",  20.6, "Thép","TĐ", "25/03/2026", "25/09/2027", "Lưới kéo"],
  ["QT-22045-TS", "Lý Thị Lan",        "Gio Linh, Quảng Trị",        "QT",  12.8, "Gỗ",  "HN", "22/03/2026", "22/03/2027", "Câu"],
  ["ĐN-95300-TS", "Trương Đình Minh",  "Sơn Trà, Đà Nẵng",           "ĐN",  25.4, "Thép","ĐK", "20/03/2026", "20/03/2028", "Lưới vây rút chì"],
  ["ĐN-95412-TS", "Hồ Văn Nam",        "Thanh Khê, Đà Nẵng",         "ĐN",  23.1, "Thép","HN", "18/03/2026", "18/03/2027", "Lưới kéo"],
  ["QNg-88110-TS","Đỗ Thị Oanh",       "Lý Sơn, Quảng Ngãi",         "QNg", 17.8, "Gỗ",  "ĐK", "15/03/2026", "15/03/2027", "Câu mực"],
  ["QNg-88247-TS","Cao Văn Phú",       "Đức Phổ, Quảng Ngãi",        "QNg", 19.4, "FRP", "GS", "12/03/2026", "12/09/2026", "Lưới rê"],
  ["BĐ-92500-TS", "Mai Quốc Quân",     "Hoài Nhơn, Bình Định",       "BĐ",  28.2, "Thép","TĐ", "10/03/2026", "10/09/2027", "Câu cá ngừ đại dương"],
  ["BĐ-92731-TS", "Nguyễn Thị Sương",  "Phù Cát, Bình Định",         "BĐ",  21.0, "Thép","ĐK", "08/03/2026", "08/03/2027", "Lưới vây"],
  ["KH-81330-TS", "Trần Đình Tài",     "Vạn Ninh, Khánh Hòa",        "KH",  32.5, "Thép","HN", "05/03/2026", "05/03/2027", "Câu cá ngừ"],
  ["KH-81588-TS", "Lê Văn Út",         "Nha Trang, Khánh Hòa",       "KH",  24.6, "Thép","ĐK", "03/03/2026", "03/03/2027", "Lưới kéo"],
  ["KH-81902-TS", "Phạm Thị Vân",      "Cam Ranh, Khánh Hòa",        "KH",  16.8, "FRP", "GS", "01/03/2026", "01/09/2026", "Lưới rê"],
  ["NT-15420-TS", "Đinh Văn Xuân",     "Ninh Hải, Ninh Thuận",       "NT",  18.0, "Gỗ",  "HN", "28/02/2026", "28/02/2027", "Câu vàng"],
  ["BT-77011-TS", "Võ Thanh Yến",      "Phan Thiết, Bình Thuận",     "BT",  22.5, "Thép","TĐ", "25/02/2026", "25/08/2027", "Lưới vây"],
  ["BT-77150-TS", "Tạ Hồng Sơn",       "La Gi, Bình Thuận",          "BT",  19.9, "FRP", "ĐK", "22/02/2026", "22/02/2027", "Lưới rê"],
  ["BT-77299-TS", "Lương Thị Tâm",     "Tuy Phong, Bình Thuận",      "BT",  14.4, "Gỗ",  "HN", "20/02/2026", "20/02/2027", "Câu"],
  ["TB-30188-TS", "Chu Văn Ước",       "Thái Thụy, Thái Bình",       "TB",  13.2, "Gỗ",  "GS", "18/02/2026", "18/08/2026", "Lưới rê"],
  ["NĐ-50071-TS", "Đào Quốc Việt",     "Hải Hậu, Nam Định",          "NĐ",  17.6, "Gỗ",  "ĐK", "15/02/2026", "15/02/2027", "Câu vàng"],
].map((r, i) => ({
  stt: i + 1,
  reg: r[0],
  owner: r[1],
  address: r[2],
  prov: r[3],
  lmax: r[4],
  hull: r[5],
  insp: r[6],
  inspDate: r[7],
  expireDate: r[8],
  gear: r[9],
  source: `${417 + i}_${r[0].split("-")[1]}_${r[6]}_${r[3]}.docx`,
  createdAt: r[7],
}));

export const RECENT_UPLOADS = [
  { file: "417_90599_ĐK_QN.docx", reg: "QN-90599-TS", owner: "Nguyễn Văn An",     prov: "QN",  insp: "ĐK", time: "Hôm nay · 10:42", status: "ok"   },
  { file: "418_90523_HN_QN.docx", reg: "QN-90523-TS", owner: "Trần Thị Bích",      prov: "QN",  insp: "HN", time: "Hôm nay · 10:38", status: "dup"  },
  { file: "419_12048_TĐ_HP.docx", reg: "HP-12048-TS", owner: "Lê Quang Cường",     prov: "HP",  insp: "TĐ", time: "Hôm nay · 10:31", status: "ok"   },
  { file: "420_12110_ĐK_HP.docx", reg: "HP-12110-TS", owner: "Phạm Minh Dũng",     prov: "HP",  insp: "ĐK", time: "Hôm nay · 09:55", status: "ok"   },
  { file: "421_unknown.docx",      reg: "—",            owner: "—",                   prov: "—",   insp: "—",  time: "Hôm nay · 09:48", status: "err"  },
  { file: "422_77512_HN_TH.docx", reg: "TH-77512-TS", owner: "Hoàng Văn Em",        prov: "TH",  insp: "HN", time: "Hôm nay · 09:30", status: "ok"   },
  { file: "423_77840_GS_TH.docx", reg: "TH-77840-TS", owner: "Vũ Thị Phương",       prov: "TH",  insp: "GS", time: "Hôm qua · 16:12", status: "ok"   },
  { file: "424_65021_ĐK_NA.docx", reg: "NA-65021-TS", owner: "Đặng Hữu Giang",      prov: "NA",  insp: "ĐK", time: "Hôm qua · 15:54", status: "ok"   },
];

export const PROVINCE_TOTALS = PROVINCES.slice().sort((a,b)=>b.count-a.count).slice(0,6);

export const INSP_TOTALS = [
  { key: "HN", label: "Hàng năm",  value: 184, color: "var(--insp-hn)" },
  { key: "TĐ", label: "Trên đà",   value:  62, color: "var(--insp-td)" },
  { key: "ĐK", label: "Định kỳ",   value: 121, color: "var(--insp-dk)" },
  { key: "GS", label: "Giám sát",  value:  44, color: "var(--insp-gs)" },
];

export const QUARTERS = ["I", "II", "III", "IV"];

export const REPORT_HISTORY = [
  { id: 5, quarter: "II",  year: 2026, createdAt: "21/05/2026 · 14:08", author: "Nguyễn Thị Bình", provs: ["QN","HP","TH"],          recs: 142, files: 2 },
  { id: 4, quarter: "I",   year: 2026, createdAt: "15/04/2026 · 09:32", author: "Nguyễn Thị Bình", provs: ["QN","HP","HT"],          recs: 139, files: 2 },
  { id: 3, quarter: "I",   year: 2026, createdAt: "12/04/2026 · 11:20", author: "Trần Văn Hải",     provs: ["BĐ","KH","BT"],          recs:  87, files: 1 },
  { id: 2, quarter: "IV",  year: 2025, createdAt: "10/01/2026 · 16:45", author: "Nguyễn Thị Bình", provs: ["QN","HP","TH","NĐ","TB"],recs: 198, files: 2 },
  { id: 1, quarter: "III", year: 2025, createdAt: "05/10/2025 · 10:11", author: "Trần Văn Hải",     provs: ["ĐN","QNg","BĐ"],          recs:  76, files: 2 },
];

export const USERS = [
  { name: "Nguyễn Thị Bình",  email: "binh.nt@danhgiem.gov.vn",  role: "admin",  lastLogin: "Hôm nay · 09:12",   status: "active" },
  { name: "Trần Văn Hải",      email: "hai.tv@danhgiem.gov.vn",   role: "staff",  lastLogin: "Hôm nay · 08:45",   status: "active" },
  { name: "Phạm Thị Lan",      email: "lan.pt@danhgiem.gov.vn",   role: "staff",  lastLogin: "Hôm qua · 17:22",   status: "active" },
  { name: "Lê Quốc Đạt",       email: "dat.lq@danhgiem.gov.vn",   role: "staff",  lastLogin: "20/05/2026 · 14:08", status: "active" },
  { name: "Vũ Minh Tuấn",      email: "tuan.vm@danhgiem.gov.vn",  role: "staff",  lastLogin: "18/05/2026 · 10:50", status: "active" },
  { name: "Hoàng Thị Mai",     email: "mai.ht@danhgiem.gov.vn",   role: "staff",  lastLogin: "—",                  status: "locked" },
];

export function provName(code) {
  const p = PROVINCES.find(x => x.code === code);
  return p ? p.name : code;
}

export function inspLabel(k) {
  return ({ HN: "Hàng năm", TĐ: "Trên đà", ĐK: "Định kỳ", GS: "Giám sát" })[k] || k;
}

export function lmaxGroup(v) {
  if (v < 15)  return "12–15m";
  if (v < 20)  return "15–20m";
  if (v < 24)  return "20–24m";
  if (v < 30)  return "24–30m";
  return "≥30m";
}

export const NAV_MAIN = [
  { id: "dashboard",       label: "Tổng quan",     emoji: "🏠", admin: false },
  { id: "upload",          label: "Upload hồ sơ",  emoji: "📤", admin: false },
  { id: "vessels",         label: "Dữ liệu tàu",   emoji: "🗄️", admin: false },
  { id: "reports/generate",label: "Xuất báo cáo",  emoji: "📊", admin: false },
  { id: "reports/history", label: "Lịch sử báo cáo",emoji: "📋", admin: false },
];

export const NAV_ADMIN = [
  { id: "admin/users",     label: "Người dùng",    emoji: "👥", admin: true },
  { id: "admin/settings",  label: "Cài đặt",       emoji: "⚙️", admin: true },
];

export const AppData = {
  PROVINCES, VESSELS, RECENT_UPLOADS, PROVINCE_TOTALS, INSP_TOTALS,
  QUARTERS, REPORT_HISTORY, USERS, NAV_MAIN, NAV_ADMIN,
  provName, inspLabel, lmaxGroup,
};

export const inspTone = (k) => ({ HN: "blue", TĐ: "purple", ĐK: "green", GS: "amber" })[k] || "gray";
export const hullTone = (m) => ({ "Gỗ": "brown", "Thép": "slate", "FRP": "teal" })[m] || "gray";
