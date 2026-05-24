# Chrome Extension MV3 - VNF Auto Crosscheck

Extension này bám vào trang `https://vnf.tongcucthuysan.gov.vn/`, đợi người dùng bấm nút tìm kiếm theo số đăng ký, gọi API riêng qua `background.js`, sau đó thêm nút `Kiểm tra & Đối soát` để so sánh và autofill dữ liệu.

## Cấu trúc

- `manifest.json`: khai báo Manifest V3, quyền `storage`, `host_permissions`, `background`, `content_scripts`, `options_page`.
- `background.js`: nhận message từ content script và gọi API với `Authorization: Bearer <TOKEN>`.
- `content.js`: lắng nghe click nút tìm kiếm, đợi kết quả xuất hiện, thêm nút đối soát, tô đỏ trường mismatch và autofill dữ liệu.
- `options.html` + `options.js`: cho người dùng nhập `apiBaseUrl`, `apiPathTemplate`, `authToken`, timeout.

## Cài đặt

1. Mở `chrome://extensions`.
2. Bật `Developer mode`.
3. Chọn `Load unpacked`.
4. Trỏ tới thư mục [chrome-extension](C:/xampp/htdocs/dangkiem-tau-ca/chrome-extension).
5. Mở `Details` của extension, vào `Extension options` để cấu hình API.

## Cấu hình selector

Trong [content.js](C:/xampp/htdocs/dangkiem-tau-ca/chrome-extension/content.js), thay toàn bộ placeholder sau bằng selector thật:

- `ENTER_SELECTOR_NUT_TIM_KIEM`
- `ENTER_SELECTOR_INPUT_SO_DK`
- `ENTER_SELECTOR_KET_QUA_TIM_KIEM`
- `ENTER_SELECTOR_OWNER_NAME`
- `ENTER_SELECTOR_DATE_OF_BIRTH`
- `ENTER_SELECTOR_ADDRESS`
- `ENTER_SELECTOR_PHONE`
- `ENTER_SELECTOR_DOSSIER_CONTENT`

Nếu cần nhiều trường hơn, thêm vào:

- `SELECTORS.compareFields`
- `SELECTORS.autofillFields`
- `FIELD_CANDIDATES`

## Kỳ vọng dữ liệu API

Extension hiện chấp nhận các key tiếng Anh hoặc key nội bộ tương đương. Ví dụ payload tối thiểu:

```json
{
  "registration_number": "QN-90599-TS",
  "owner_name": "Nguyen Van A",
  "date_of_birth": "1985-10-01",
  "address": "Ha Long, Quang Ninh",
  "phone_number": "0912345678",
  "dossier_content": "Cap lai giay chung nhan"
}
```

Endpoint mặc định đang để:

```text
GET /api/extension/vessels/{registrationNumber}
Authorization: Bearer <TOKEN>
```

Repo backend hiện đã có alias mặc định:

```text
GET /api/extension/vessels/{registrationNumber}
Authorization: Bearer <EXTENSION_API_TOKEN>
```

Bạn chỉ cần cấu hình cùng token ở:

- backend: `EXTENSION_API_TOKEN` trong `.env`
- extension: `Bearer Token` trong `options.html`

## Luồng hoạt động

1. Người dùng nhập số đăng ký và bấm tìm kiếm trên trang đích.
2. Content script đợi vùng kết quả xuất hiện bằng polling ngắn.
3. Content script gửi message sang `background.js`.
4. Background gọi API riêng, kiểm tra JSON, trả dữ liệu về content script.
5. Content script chèn nút `Kiểm tra & Đối soát`.
6. Khi người dùng bấm nút này:
   - so sánh các trường đã cấu hình
   - cảnh báo mismatch bằng `alert` và viền đỏ
   - autofill các trường còn lại
   - dispatch `input` và `change`

## Bảo mật

- Không hardcode token trong source logic xử lý.
- Token nằm trong `chrome.storage.local`, người dùng tự cấu hình ở trang options.
- API được gọi từ `background.js`, nên request không xuất hiện trong Network tab của trang web chính. Nó vẫn có thể nhìn thấy trong DevTools của extension/service worker.
- Nên kiểm tra thêm ở backend:
  - `Authorization` hợp lệ
  - `Origin` hoặc `chrome-extension://<extension-id>`
  - rate limiting
  - validation schema response

## Debug khi bị CORS hoặc không gọi được API

### 1. Kiểm tra service worker

Mở `chrome://extensions` -> extension của bạn -> `Service worker` -> `Inspect`.

Kiểm tra các lỗi:

- `Failed to fetch`
- `TypeError: NetworkError`
- `API lỗi 401/403`

### 2. Kiểm tra host permissions

`manifest.json` phải chứa domain API trong `host_permissions`.

Ví dụ:

```json
"host_permissions": [
  "https://vnf.tongcucthuysan.gov.vn/*",
  "http://localhost:8000/*"
]
```

### 3. Nếu backend chặn CORS

Với request từ extension, backend thường vẫn nên cho phép:

- `chrome-extension://<EXTENSION_ID>`
- hoặc nới `allow_origins` cho môi trường dev

Với FastAPI:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "chrome-extension://<EXTENSION_ID>",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Nếu backend xác thực theo `Origin`, nhớ rằng một số request extension có thể không gửi `Origin` như request web bình thường. Khi đó nên xác thực bằng token là chính, `Origin` chỉ là lớp phụ.

### 4. Kiểm tra selector

Nếu không thấy nút `Kiểm tra & Đối soát`, nguyên nhân phổ biến là:

- selector nút tìm kiếm sai
- selector vùng kết quả sai
- trang render chậm hơn `timeoutMs`

Hướng xử lý:

- lấy lại selector bằng `Copy -> JS Path` hoặc CSS selector ổn định hơn
- tăng thời gian trong `waitForSearchResults()`
- nếu trang render động mạnh, giữ `MutationObserver` như hiện tại

### 5. Kiểm tra payload API

Nếu API trả tên field khác, bổ sung vào `FIELD_CANDIDATES` trong `content.js`.
