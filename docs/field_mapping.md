# Field Mapping - DOCX Parser

## Mục tiêu

Tài liệu này mô tả mapping giữa vị trí dữ liệu trong 3 file DOCX mẫu và tên field hệ thống cần parse để phục vụ:

- workbook chi tiết `TỔNG HỢP GHI SỔ THỦ TỤC. 2026.xlsx`
- workbook báo cáo `BÁO CÁO 3 QUÝ I. 2026 GỬI CÁC SỞ.xlsx`

Ba file DOCX đã đối chiếu:

- `417.90523.ĐK.QN.docx`
- `416.90559.HN.QN.docx`
- `418.90682.TĐ.QN.docx`

## Quy ước định vị

Để bám đúng yêu cầu nghiệp vụ, tài liệu này dùng đồng thời 2 cách ghi tọa độ:

- Cách ghi business-friendly:
  - `Bảng 1, Hàng 1, Cột 2`
  - `Paragraph sau Bảng 2`
- Cách ghi kỹ thuật cho `python-docx`:
  - `T0.R0.C1`
  - `P2`

Quy đổi:

- `Bảng 1` tương ứng `T0`
- `Hàng 1` tương ứng `R0`
- `Cột 1` tương ứng `C0`
- `Paragraph #0` tương ứng `P0`

## Skeleton chung của cả 3 DOCX

Đối chiếu thực tế cho thấy cả 3 file có cùng skeleton:

- `6` bảng: `Bảng 1..6` tương ứng `T0..T5`
- `21` paragraph ngoài bảng: `P0..P20`
- Các field chính đều nằm đúng cùng vị trí giữa 3 file

### Thứ tự phần tử trong body

| Thứ tự body | Nhãn kỹ thuật | Nội dung nhận diện |
| --- | --- | --- |
| 1 | `T0` | Header công ty + số chứng nhận |
| 2 | `P0` | Tiêu đề tiếng Việt |
| 3 | `P1` | Tiêu đề tiếng Anh |
| 4 | `T1` | Tên tàu, số đăng ký, hô hiệu |
| 5 | `P2` | Chủ tàu, quốc tịch |
| 6 | `P3` | Địa chỉ |
| 7 | `P4` | Năm và nơi đóng |
| 8 | `T2` | Thông số kỹ thuật chính |
| 9 | `P5` | Paragraph rỗng |
| 10 | `T3` | Bảng máy chính |
| 11 | `P6` | Số biên bản kiểm tra + ngày kiểm tra |
| 12 | `P7` | Paragraph tiếng Anh |
| 13 | `P8` | Tiêu đề chứng nhận |
| 14 | `P9` | Paragraph tiếng Anh |
| 15 | `P10` | Trạng thái kỹ thuật |
| 16 | `T4` | Đánh dấu cấp hoạt động |
| 17 | `P11` | Vùng hoạt động |
| 18 | `P12` | Paragraph tiếng Anh |
| 19 | `P13` | Hạn hiệu lực |
| 20 | `P14` | Paragraph tiếng Anh |
| 21 | `T5` | Nơi cấp + ngày cấp |
| 22 | `P15..P19` | Paragraph rỗng |
| 23 | `P20` | Giám đốc ký |

## Bảng mapping fields

| STT | Tên field hệ thống | Loại phần tử | Tọa độ theo yêu cầu | Tọa độ kỹ thuật | Ghi chú xử lý dữ liệu |
| --- | --- | --- | --- | --- | --- |
| 1 | `certificate_no` | Ô trong bảng | `Bảng 1, Hàng 1, Cột 1` | `T0.R0.C0` | Regex sau nhãn `Số:`. Ví dụ `417.26/ĐK.QN/ĐKTC`. |
| 2 | `inspection_type_code` | Field suy diễn | Suy diễn từ `certificate_no` hoặc tên file | Derived | Lấy token giữa năm và tỉnh: `HN`, `TĐ`, `ĐK`. Đây là nguồn cho cột `Hình thức kiểm tra`. |
| 3 | `registration_number` | Ô trong bảng | `Bảng 2, Hàng 1, Cột 2` | `T1.R0.C1` | Regex sau `Số đăng ký:`. Đây là ví dụ được nêu trực tiếp trong brief. |
| 4 | `owner_name` | Paragraph | `Paragraph sau Bảng 2` | `P2` | Regex giữa `owner):` và `; Quốc tịch`. Đây là ví dụ thứ hai được nêu trực tiếp trong brief. |
| 5 | `nationality` | Paragraph | `Paragraph sau Bảng 2` | `P2` | Regex sau `Quốc tịch: (Flag):`. |
| 6 | `address` | Paragraph | `Paragraph thứ 2 sau Bảng 2` | `P3` | Regex sau `Địa chỉ: (Address):`. |
| 7 | `build_year` | Paragraph | `Paragraph thứ 3 sau Bảng 2` | `P4` | Regex phần số trước dấu `;`. |
| 8 | `build_place` | Paragraph | `Paragraph thứ 3 sau Bảng 2` | `P4` | Regex phần sau dấu `;`. |
| 9 | `fishing_gear` | Ô trong bảng | `Bảng 3, Hàng 1, Cột 1` | `T2.R0.C0` | Regex sau `Công dụng (nghề):`. Map sang cột `NGHỀ`. |
| 10 | `hull_material` | Ô trong bảng | `Bảng 3, Hàng 1, Cột 3` | `T2.R0.C2` | Giá trị thực nằm ở ô cuối hàng do ô đầu bị merge ngang. Regex sau `Vật liệu thân, vỏ:`. |
| 11 | `gross_tonnage` | Ô trong bảng | `Bảng 3, Hàng 2, Cột 1` | `T2.R1.C0` | Regex sau `Tổng dung tích:`. |
| 12 | `crew_count` | Ô trong bảng | `Bảng 3, Hàng 2, Cột 3` | `T2.R1.C2` | Regex sau `Số thuyền viên:`. |
| 13 | `lmax_m` | Ô trong bảng | `Bảng 3, Hàng 3, Cột 1` | `T2.R2.C0` | Đây là ví dụ thứ ba trong brief: `Lmax`. |
| 14 | `bmax_m` | Ô trong bảng | `Bảng 3, Hàng 3, Cột 2` | `T2.R2.C1` | Regex sau `Chiều rộng, Bmax:`. |
| 15 | `depth_d_m` | Ô trong bảng | `Bảng 3, Hàng 3, Cột 3` | `T2.R2.C2` | Regex sau `Chiều cao mạn, D:`. |
| 16 | `ltk_m` | Ô trong bảng | `Bảng 3, Hàng 4, Cột 1` | `T2.R3.C0` | Regex sau `Chiều dài thiết kế, Ltk:`. |
| 17 | `btk_m` | Ô trong bảng | `Bảng 3, Hàng 4, Cột 2` | `T2.R3.C1` | Regex sau `Chiều rộng thiết kế, Btk:`. |
| 18 | `draft_m` | Ô trong bảng | `Bảng 3, Hàng 4, Cột 3` | `T2.R3.C2` | Regex sau `Chiều chìm, d:`. |
| 19 | `main_engine_power_kw` | Ô trong bảng | `Bảng 3, Hàng 5, Cột 1` | `T2.R4.C0` | Regex sau `Ne (KW):`. Map sang cột `Máy chính (KW)`. |
| 20 | `main_engine_count` | Ô trong bảng | `Bảng 3, Hàng 5, Cột 3` | `T2.R4.C2` | Giá trị thực nằm ở ô cuối hàng do ô đầu bị merge ngang. |
| 21 | `engine_model` | Ô trong bảng | `Bảng 4, Hàng 2, Cột 2` | `T3.R1.C1` | Dòng máy chính đầu tiên. |
| 22 | `engine_serial` | Ô trong bảng | `Bảng 4, Hàng 2, Cột 3` | `T3.R1.C2` | Có thể là số hoặc chuỗi `Không xác định`. |
| 23 | `engine_power_kw_crosscheck` | Ô trong bảng | `Bảng 4, Hàng 2, Cột 4` | `T3.R1.C3` | Dùng để đối chiếu với `main_engine_power_kw`. |
| 24 | `engine_origin_note` | Ô trong bảng | `Bảng 4, Hàng 2, Cột 5` | `T3.R1.C4` | Ví dụ `Máy cũ; Nhật Bản`. |
| 25 | `inspection_minute_no` | Paragraph | `Paragraph sau Bảng 4` | `P6` | Regex sau `biên bản kiểm tra kỹ thuật số:`. |
| 26 | `inspection_date` | Paragraph | `Paragraph sau Bảng 4` | `P6` | Regex cụm `ngày ... tháng ... năm ...`. |
| 27 | `technical_status` | Paragraph | `Paragraph thứ 5 sau Bảng 4` | `P10` | Regex sau dấu `:` cuối cùng. |
| 28 | `operation_limit_class` | Nhóm ô trong bảng | `Bảng 5, Hàng 2, Cột 2..5` | `T4.R1.C1..C4` | Xác định cột có `X`. |
| 29 | `operation_zone_note` | Paragraph | `Paragraph sau Bảng 5` | `P11` | Regex sau `Được phép hoạt động tại:`. |
| 30 | `certificate_valid_until` | Paragraph | `Paragraph thứ 3 sau Bảng 5` | `P13` | Regex ngày hết hạn. Map sang cột `Hạn Đk`. |
| 31 | `issued_place` | Ô trong bảng | `Bảng 6, Hàng 1, Cột 2` | `T5.R0.C1` | Regex sau `Cấp tại`. |
| 32 | `issued_date` | Ô trong bảng | `Bảng 6, Hàng 1, Cột 2` | `T5.R0.C1` | Regex cụm `ngày ... tháng ... năm ...`. Map sang cột `Ngày, tháng`. |
| 33 | `director_name` | Paragraph | `Paragraph cuối tài liệu` | `P20` | Regex sau `Giám đốc:`. |
| 34 | `province_code` | Field suy diễn | Suy diễn từ `registration_number` | Derived | Tiền tố trước dấu `-`, ví dụ `QN`, `NA`, `TH`, `HY`. |
| 35 | `length_bucket` | Field suy diễn | Suy diễn từ `lmax_m` | Derived | Map theo ngưỡng `12-<15`, `15-<20`, `20-<24`, `24-<30`, `>=30`. |

## Các field có mặt trên form nhưng mẫu đang trống

| Field | Tọa độ theo yêu cầu | Tọa độ kỹ thuật | Nhận xét |
| --- | --- | --- | --- |
| `vessel_name` | `Bảng 2, Hàng 1, Cột 1` | `T1.R0.C0` | Cả 3 mẫu đều để trống phần giá trị sau `Tên tàu:`. |
| `call_sign` | `Bảng 2, Hàng 1, Cột 3` | `T1.R0.C2` | Cả 3 mẫu đều chỉ có placeholder dấu chấm. |
| `deadweight` | `Bảng 3, Hàng 2, Cột 2` | `T2.R1.C1` | Chỉ có nhãn `Trọng tải toàn phần`, không có số liệu thực. |

## Mapping sang output workbook

### 1. Sheet chi tiết trong `TỔNG HỢP GHI SỔ THỦ TỤC. 2026.xlsx`

| Cột output | Field nguồn đề xuất |
| --- | --- |
| `Ngày, tháng` | `issued_date` |
| `Họ và tên` | `owner_name` |
| `Địa chỉ` | `address` |
| `Số đăng ký` | `registration_number` |
| `Máy chính (KW)` | `main_engine_power_kw` |
| `Chiều dài` | `lmax_m` |
| `Hình thức kiểm tra` | map label từ `inspection_type_code` |
| `Hạn Đk` | `certificate_valid_until` |
| `NGHỀ` | `fishing_gear` |
| `HN/TĐ/ĐK/GS/BT` | one-hot từ `inspection_type_code` |
| `L 12-15`, `L 15-20`, `L 20-24`, ... | one-hot từ `length_bucket` |
| `NA/TH/HY/...` | one-hot từ `province_code` |

### 2. Workbook `BÁO CÁO 3 QUÝ I. 2026 GỬI CÁC SỞ.xlsx`

Workbook báo cáo không lấy text trực tiếp từ DOCX mà tổng hợp từ các field đã parse:

- `Nhóm tàu`: suy từ `length_bucket`
- `Số tàu theo vật liệu vỏ`: suy từ `hull_material`
- `Hàng năm / Trên đà / Định kỳ / Cải hoán / Lần đầu`: suy từ `inspection_type_code`
- `Gỗ / Thép / FRP`: suy từ `hull_material`

## Edge cases phát hiện từ 3 DOCX mẫu

### 1. Giá trị nằm chung ô với nhãn Việt và nhãn Anh

Ví dụ:

- `Bảng 2, Hàng 1, Cột 2`: `Số đăng ký: QN-90523-TS Registration number...`
- `Bảng 3, Hàng 3, Cột 1`: `Chiều dài, Lmax: 21,50 (m) Length overal...`

Khuyến nghị:

- Regex theo nhãn tiếng Việt ở đầu ô.
- Không split cứng theo khoảng trắng vì nhãn tiếng Anh dính ngay sau value.

### 2. Giá trị bị tách nhiều run, xen kẽ bold và italic

Quan sát thực tế:

- `registration_number`, `owner_name`, `lmax_m` đều bị chia thành nhiều `run`.
- Label tiếng Anh thường italic, value tiếng Việt thường bold.

Khuyến nghị:

- Dùng `cell.text` hoặc nối toàn bộ `runs` trước khi regex.
- Không dựa vào số lượng `run` hay style font để lấy dữ liệu.

### 3. Một ô có nhiều paragraph hoặc line break nội bộ

Quan sát:

- `Bảng 1, Hàng 1, Cột 1` có `3` paragraph trong cùng ô.
- `Bảng 1, Hàng 1, Cột 2` và `Bảng 6, Hàng 1, Cột 2` có line break nội bộ.
- Hầu hết ô song ngữ có `2` paragraph trong cùng ô.

Khuyến nghị:

- Nối toàn bộ paragraph trong ô bằng khoảng trắng.
- Dùng `.strip()` và `re.sub(r"\s+", " ", text)` để chuẩn hóa.

### 4. Có ô bị merged

Quan sát:

- `Bảng 3, Hàng 1, Cột 1` merge ngang sang cột 2.
- `Bảng 3, Hàng 5, Cột 1` merge ngang sang cột 2.
- `Bảng 5, Cột 1` merge dọc giữa 2 hàng.

Khuyến nghị:

- Không hard-code số cột hữu hiệu chỉ bằng mắt.
- Nếu cần phân tích merge, đọc `gridSpan` và `vMerge` từ XML.
- Với parser field hiện tại, truy đúng cell có giá trị thực là đủ.

### 5. Dữ liệu số dính đơn vị đo và dùng dấu phẩy thập phân

Ví dụ:

- `21,50 (m)`
- `338,56`
- `0,90 (m)`

Khuyến nghị:

- Regex số: `r"[-+]?[0-9]+(?:[.,][0-9]+)?"`
- Chuẩn hóa `,` thành `.` trước khi cast `float`
- Loại bỏ đơn vị như `(m)`, `(KW)`, `kW`

### 6. Field ngày tháng không có khoảng trắng ổn định

Ví dụ quan sát từ XML gốc:

- `ngày08tháng5năm 2027`
- `ngày 10tháng 5 năm 2026`
- `ngày09 tháng 5 năm 2026`

Khuyến nghị:

- Dùng regex linh hoạt:

```python
r"ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})"
```

### 7. Có field rỗng hoặc chỉ là placeholder

Quan sát:

- `vessel_name`, `call_sign`, `deadweight` trống ở cả 3 mẫu
- Dòng engine phụ `Bảng 4, Hàng 3` chỉ chứa `-`

Khuyến nghị:

- Chuẩn hóa `""`, `"."`, `"...."`, `"-"` thành `None`
- Không giả định mọi field đều có dữ liệu thực

### 8. Có field phải suy diễn thay vì đọc trực tiếp

Ví dụ:

- `inspection_type_code`: suy từ `certificate_no` hoặc tên file
- `province_code`: suy từ tiền tố `registration_number`
- `length_bucket`: suy từ `lmax_m`

Khuyến nghị:

- Tách rõ 2 bước:
  - parse raw fields từ DOCX
  - derive normalized fields phục vụ report/output

## Logic xử lý chuỗi đề xuất

```python
import re

NUMBER_RE = re.compile(r"[-+]?[0-9]+(?:[.,][0-9]+)?")
DATE_RE = re.compile(r"ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})", re.I)

def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()

def extract_number(text: str) -> float | None:
    m = NUMBER_RE.search(normalize_text(text))
    if not m:
        return None
    return float(m.group(0).replace(",", "."))

def extract_after_label(text: str, label: str) -> str | None:
    text = normalize_text(text)
    idx = text.find(label)
    if idx < 0:
        return None
    value = text[idx + len(label):].strip(" :.-")
    return value or None
```

## Kết luận

Ba DOCX mẫu có cấu trúc đủ đồng nhất để viết parser theo tọa độ cố định `paragraph/table/cell`. Phần cần chú ý nhất không phải thay đổi layout mà là:

- nhiều run và style xen kẽ
- text Việt/Anh dính liền trong cùng ô
- merged cells
- khoảng trắng không ổn định
- số dính đơn vị
- một số cột output là field suy diễn
