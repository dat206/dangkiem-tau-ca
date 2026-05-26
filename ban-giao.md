# Ghi chú Cập nhật: Sửa lỗi hiển thị số lượng Tỉnh

## 1. Nội dung thay đổi (Code Changes)

### 1.1. Sửa lỗi logic bộ lọc Tỉnh (File: [screens-data.jsx](./screens-data.jsx))
- **Component Tìm Kiếm:** [searchbox.jsx](./searchbox.jsx) (Được sử dụng lại nhiều lần)
- **Vị trí:** Component `VesselsScreen` (khoảng dòng 220).
- **Vấn đề:** Label của mục "Tất cả" trong dropdown đang lấy nhầm biến đếm số lượng tàu `VESSELS.length` (26) thay vì số lượng tỉnh `PROVINCES.length` (28).
- **Cách fix:** Đổi biến nội suy trong chuỗi từ `VESSELS.length` thành `PROVINCES.length`.
- **Diff chi tiết:**
```diff
  <window.AutocompleteSearchBox
    data={[
-     { value: "all", label: `Tất cả (${VESSELS.length})` },
+     { value: "all", label: `Tất cả (${PROVINCES.length})` },
      ...PROVINCES.map(p => ({ value: p.code, label: p.name }))
    ]}
```

### 1.2. Cập nhật Comment dữ liệu (File: `data.jsx`)
- **Sửa đổi:** Sửa comment giải thích về mock data từ `26 vessels` thành `28 vessels` để phản ánh đúng lượng dữ liệu.

## 2. Hướng dẫn Test
1. Vào màn hình **Dữ liệu Tàu cá**.
2. Mở dropdown ở bộ lọc **Tỉnh**.
3. Check dòng đầu tiên, kết quả hiển thị mong đợi phải là: **Tất cả (28)**.
