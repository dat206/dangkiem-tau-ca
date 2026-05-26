# 🎨 UI/UX Design Prompt — Hệ thống Đăng kiểm Tàu cá

**Dùng cho:** Claude / AI Design Tool  
**Mục tiêu:** Sinh toàn bộ mockup giao diện cho hệ thống web quản lý đăng kiểm tàu cá

---

## CONTEXT & SYSTEM OVERVIEW

You are designing a **professional web application** for a Vietnamese government-adjacent fisheries vessel inspection reporting system. The app is used daily by Vietnamese fishery inspection officers to:

1. **Log in securely** (role-based: Admin vs Staff)
2. **Upload DOCX certificates** (Giấy Chứng Nhận An Toàn Kỹ Thuật Tàu Cá) — these get parsed and stored in a PostgreSQL database
3. **View & manage** the growing database of vessel inspection records
4. **Generate quarterly Excel reports** from the stored data (not from uploaded files directly)
5. **Download** two report formats: "Bảng kê tổng hợp" and "Báo cáo quý theo tỉnh"

**Key business logic to surface in UI:**
- Vessels are classified by Lmax length groups: 12–15m / 15–20m / 20–24m / 24–30m / ≥30m
- Inspection types: HN (Hàng năm) / TĐ (Trên đà) / ĐK (Định kỳ) / GS (Giám sát)
- Hull materials: Gỗ / Thép / FRP
- Province codes extracted from registration numbers (e.g. QN-90599-TS → Quảng Ninh)
- Reports are quarterly (Quý I / II / III / IV) per year

---

## DESIGN SYSTEM REQUIREMENTS

**Visual identity:**
- Color palette: Deep ocean blue `#0b3d6b` (primary), teal `#0d7377` (accent), warm white `#f8fafc` (background), slate grays for text
- Use ocean/maritime metaphors subtly — no cartoonish fish icons, keep it professional
- Typography: Clean sans-serif (Inter or Nunito). Vietnamese diacritics must render correctly
- Border radius: 8–12px for cards, 6px for inputs/buttons
- Subtle shadows for cards: `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`

**Layout:**
- Fixed left sidebar navigation (240px wide) + main content area
- Sidebar collapses to icon-only on smaller screens
- Top header bar with user info, notifications, breadcrumb
- Max content width: 1200px centered

**Component style:**
- Buttons: Solid primary (blue), ghost secondary, destructive red — all with hover states
- Tables: Striped rows, sticky header, pagination, row hover highlight
- Forms: Floating labels or clear top labels, inline validation messages
- Status badges: Color-coded pills (success green, warning amber, error red, info blue)
- Loading states: Skeleton screens, not spinners
- Empty states: Illustrated (simple SVG) with helpful CTA text in Vietnamese

---

## SCREENS TO DESIGN

### SCREEN 1 — Login Page (`/login`)

**Purpose:** Secure entry point. Simple, focused, trustworthy.

**Layout:** Full-page centered card (480px wide). Left half: branding/illustration. Right half: form.

**Content:**
- Logo + system name: "Hệ thống Đăng kiểm Tàu cá" + subtitle "Cục Đăng kiểm Việt Nam"
- Decorative element: Abstract wave or vessel silhouette (SVG, minimal)
- Form fields:
  - Email/Username input with envelope icon
  - Password input with eye toggle (show/hide)
  - "Ghi nhớ đăng nhập" checkbox
  - Primary CTA button: "Đăng nhập" (full width, deep blue)
- Error state: Red inline message below form ("Sai tên đăng nhập hoặc mật khẩu")
- Loading state: Button shows spinner + "Đang xác thực..."
- Footer: Version number + copyright

**Do NOT include:** Social login, "Sign up" link (closed system), forgot password (admin resets)

---

### SCREEN 2 — Dashboard / Home (`/dashboard`)

**Purpose:** At-a-glance overview. First thing users see after login.

**Layout:** 4 stat cards (top row) + 2 charts (middle) + recent activity table (bottom)

**Stat cards (4 cards in a row):**
1. **Tổng tàu trong DB** — large number + icon (anchor), subtitle "Toàn bộ dữ liệu"
2. **Upload tháng này** — number + trend arrow up/down vs last month
3. **Quý hiện tại** — "Quý II / 2026" + number of records this quarter
4. **Báo cáo đã xuất** — count of generated reports this quarter

**Charts (2 side by side):**
- Left: Bar chart — "Số tàu theo tỉnh" (top 6 provinces, horizontal bars)
- Right: Donut chart — "Phân loại theo hình thức KT" (HN/TĐ/ĐK/GS with legend)

**Recent uploads table:**
- Columns: STT | Tên file | Số đăng ký | Chủ tàu | Tỉnh | Hình thức KT | Thời gian upload | Trạng thái
- Status badges: "Thành công" (green) / "Lỗi parse" (red) / "Trùng lặp" (amber)
- Show last 8 entries, "Xem tất cả →" link

**Sidebar navigation (visible on all screens):**
```
🏠 Tổng quan
📤 Upload Hồ sơ
🗄️  Dữ liệu Tàu
📊 Xuất Báo cáo
📋 Lịch sử Báo cáo
─────────────────
⚙️  Cài đặt        [Admin only]
👥 Người dùng    [Admin only]
```

---

### SCREEN 3 — Upload Hồ sơ (`/upload`)

**Purpose:** Core daily workflow. Upload 1–50 DOCX files, see real-time parse results.

**Layout:** Two-panel layout. Left (40%): upload zone + file list. Right (60%): parse results feed.

**Left panel — File input:**
- Large drag-and-drop zone (dashed border, cloud-upload icon, "Kéo thả file .docx vào đây" text, "hoặc" divider, "Chọn file" button)
- Accepted: .docx only — show error if wrong type dropped
- File list below drop zone: each file shows [file icon] [filename truncated] [size] [remove ×]
- Counter: "3 file đã chọn"
- Primary button: "Xử lý & Lưu vào DB" (disabled until files selected)
- Progress bar: appears during processing, shows "Đang xử lý 2/3 file..."

**Right panel — Results feed (appears after processing):**
- Summary banner: "✅ 2 thành công · ⚠️ 1 trùng lặp · ❌ 0 lỗi"
- Result list: one row per file processed:
  - ✅ `417_90523_ĐK_QN.docx` → QN-90523-TS · Nguyễn Văn An · Quảng Ninh · Lmax 18.5m · ĐK
  - ⚠️ `416_90599_HN_QN.docx` → Đã tồn tại trong DB, bỏ qua (link "Xem record")
  - ❌ `bad_file.docx` → Lỗi: Không tìm thấy Số đăng ký
- Each row expandable to show all parsed fields

**Empty state (no files yet):** Simple illustration + "Chưa có file nào được tải lên hôm nay"

---

### SCREEN 4 — Dữ liệu Tàu / Vessel Records (`/vessels`)

**Purpose:** Browse, search and filter all stored vessel records. The "source of truth" view.

**Layout:** Filter bar (top) + data table (full width) + pagination

**Filter bar:**
- Search input: "Tìm theo số ĐK, chủ tàu..." (full-text)
- Dropdown: Tỉnh (All + 15 provinces)
- Dropdown: Hình thức KT (Tất cả / HN / TĐ / ĐK / GS)
- Dropdown: Nhóm Lmax (Tất cả / 12-15m / 15-20m / 20-24m / 24-30m / ≥30m)
- Date range picker: "Ngày kiểm tra từ...đến..."
- "Lọc" button + "Xóa bộ lọc" link
- Right side: record count "Hiển thị 245 kết quả" + Export CSV button

**Data table columns:**
| STT | Số ĐK | Chủ tàu | Địa chỉ | Tỉnh | Lmax (m) | Vật liệu | Hình thức KT | Ngày KT | Hạn ĐK | Nghề | Thao tác |

- "Hình thức KT" column: colored badge (HN=blue, TĐ=purple, ĐK=green, GS=amber)
- "Vật liệu" column: small pill (Gỗ=brown, Thép=gray, FRP=teal)
- "Thao tác" column: View icon button only (no edit/delete for Staff; Admin has delete)
- Sticky header when scrolling
- Click row to open detail drawer/modal

**Row detail modal:**
- Slide-in drawer from right (400px)
- All fields displayed in 2-column grid
- "Tệp nguồn:" shows source_filename
- "Ngày nhập hệ thống:" shows created_at

**Pagination:** "← Trước | 1 2 3 ... 12 | Sau →" + "20 bản ghi/trang" selector

---

### SCREEN 5 — Xuất Báo cáo (`/reports/generate`)

**Purpose:** Generate quarterly Excel reports from stored DB data. Main output feature.

**Layout:** Single-column centered (max 640px), wizard-style in 2 clear sections

**Section A — Chọn kỳ báo cáo:**
- Label: "Kỳ báo cáo"
- Quarter selector: 4 large toggle buttons "Quý I · Quý II · Quý III · Quý IV" (pill style, only one selectable)
- Year input: number input, default current year
- Auto-computed info box (updates live): "📊 Quý I/2026: 01/01/2026 – 31/03/2026 · **247 bản ghi** trong DB cho kỳ này"
- If 0 records: amber warning "Không có dữ liệu cho kỳ này. Hãy upload hồ sơ trước."

**Section B — Chọn tỉnh:**
- "Chọn tỉnh cần đưa vào báo cáo"
- Province grid: checkboxes in 3-column grid, each showing province name + record count badge
  - Example: [✓] Quảng Ninh (84) · [ ] Thanh Hóa (31) · [✓] Hà Tĩnh (12)...
- "Chọn tất cả" / "Bỏ chọn tất cả" links
- Selected summary: "Đã chọn 3 tỉnh · 139 bản ghi sẽ được tổng hợp"

**Action area:**
- Two output format cards side by side:
  - 📄 **Bảng kê tổng hợp** — "Danh sách chi tiết từng tàu theo thứ tự thời gian" — checkbox (default checked)
  - 📊 **Báo cáo quý theo tỉnh** — "Thống kê phân loại theo tỉnh, nhóm Lmax và vật liệu" — checkbox (default checked)
- Primary button: "🔄 Tạo báo cáo & Tải xuống" (full-width, disabled if no province selected)
- Loading state: Progress animation "Đang tổng hợp 139 bản ghi từ DB..." → "Đang tạo file Excel..." → "Đang nén file..."

**Success state (replaces button area):**
- Green success banner: "✅ Báo cáo tạo thành công"
- Two download buttons: [⬇ Bảng kê tổng hợp .xlsx] [⬇ Báo cáo quý .xlsx] or [⬇ Tải tất cả .zip]
- Summary: "Đã tổng hợp 139 tàu · 3 tỉnh · Quý I/2026"
- Link: "Xem trong Lịch sử báo cáo →"

---

### SCREEN 6 — Lịch sử Báo cáo (`/reports/history`)

**Purpose:** Audit trail of all generated reports with re-download capability.

**Layout:** Filter bar + table + pagination

**Filter bar:**
- Year dropdown + Quarter dropdown + "Người tạo" dropdown (Admin only)

**Table columns:**
| # | Kỳ báo cáo | Ngày tạo | Người tạo | Số tỉnh | Số bản ghi | Loại file | Tải lại |
|---|---|---|---|---|---|---|---|
| 1 | Quý I / 2026 | 15/04/2026 · 09:32 | Nguyễn Thị B | 3 tỉnh | 139 bản ghi | 2 file Excel | [⬇] |

- "Tải lại" button re-downloads the same report (if still cached) or shows "Hết hạn, tạo lại"
- Row shows which provinces were included (hover tooltip)

---

### SCREEN 7 — Quản lý Người dùng (`/admin/users`) — Admin only

**Purpose:** Manage staff accounts. Simple CRUD.

**Layout:** Table with "Thêm người dùng" button top-right

**Table columns:**
| Họ tên | Email | Vai trò | Lần đăng nhập cuối | Trạng thái | Thao tác |

- Role badge: "Admin" (purple) / "Nhân viên" (blue)
- Status badge: "Hoạt động" (green) / "Bị khóa" (red)
- Action buttons: Edit (pencil icon) | Lock/Unlock | Delete (red, with confirm modal)

**Add/Edit user modal:**
- Fields: Họ tên | Email | Mật khẩu (masked, with "Đặt lại mật khẩu" option for edit) | Vai trò dropdown | Trạng thái toggle
- Validation inline

---

### SCREEN 8 — Cài đặt hệ thống (`/admin/settings`) — Admin only

**Purpose:** System configuration. Clean, grouped.

**Layout:** Settings grouped in cards

**Card 1 — Thông tin đơn vị:**
- Tên đơn vị (text input)
- Địa chỉ, điện thoại, email
- Logo upload (shown as preview)
- "Lưu thay đổi" button

**Card 2 — Cấu hình báo cáo:**
- Năm hoạt động (current fiscal year)
- Danh sách tỉnh mặc định (multi-select, drag to reorder)
- Mã tỉnh tùy chỉnh (table: mã → tên, add/remove rows)

**Card 3 — Bảo mật:**
- Session timeout duration
- "Bắt buộc đổi mật khẩu sau X ngày" toggle + input

---

## NAVIGATION & USER ROLES

**Two roles:**
- **Admin:** Sees all screens including /admin/* routes. Sidebar shows "Người dùng" and "Cài đặt" sections.
- **Nhân viên (Staff):** Sees Dashboard, Upload, Dữ liệu Tàu, Xuất Báo cáo, Lịch sử. No admin routes. Cannot delete records.

**User info in sidebar footer:**
- Avatar (initials circle) + Name + Role badge
- "Đăng xuất" button

---

## RESPONSIVE BEHAVIOR

- **Desktop (≥1200px):** Full sidebar + full table columns
- **Tablet (768–1199px):** Sidebar collapses to icons only, tap to expand. Tables scroll horizontally.
- **Mobile (< 768px):** Hamburger menu. Upload screen stacks vertically. Tables show only key columns (Số ĐK, Tỉnh, Trạng thái). Report generation still fully functional.

---

## KEY INTERACTION PATTERNS

1. **Upload feedback:** Each file shows a real-time status badge as it's processed (pending → processing spinner → success/error). Never block the UI.
2. **Live record count:** On the report generation screen, the record count updates immediately when quarter/year/province changes — no button press needed.
3. **Confirmation dialogs:** All destructive actions (delete, clear filters, re-upload) require a modal confirm with clear consequences described.
4. **Toast notifications:** Non-blocking success/error toasts in top-right corner (3-second auto-dismiss for success, manual dismiss for errors).
5. **Empty states:** Every table/list must have a designed empty state with a clear next action (e.g., "Chưa có tàu nào. Bắt đầu bằng cách Upload hồ sơ →").
6. **Data freshness:** Dashboard shows "Cập nhật lần cuối: 2 phút trước" with a refresh icon.

---

## WHAT NOT TO DO

- ❌ No dark mode (government/office context, keep it clean light)
- ❌ No gratuitous animations — this is a data entry tool, not a portfolio site
- ❌ No English text in the UI (100% Vietnamese labels, placeholders, error messages)
- ❌ No infinite scroll — paginate tables explicitly
- ❌ Do not show raw database IDs to end users
- ❌ No placeholder data that looks like real personal info — use clearly fake names

---

## DELIVERABLES REQUESTED

Design the following screens as high-fidelity mockups (desktop 1440px viewport):

1. `/login` — Login page
2. `/dashboard` — Dashboard with stats + charts + recent activity
3. `/upload` — Upload DOCX with results panel
4. `/vessels` — Vessel database table with filters
5. `/reports/generate` — Report generation wizard
6. `/reports/history` — Report history table
7. `/admin/users` — User management (Admin view)
8. `/admin/settings` — System settings (Admin view)

For each screen, also provide:
- The primary "happy path" state (everything works)
- At least one error/empty state
- Mobile layout (375px viewport) for screens 2, 3, and 5

