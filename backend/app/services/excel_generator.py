import sqlite3
import openpyxl
from datetime import datetime
import os

def xuat_excel_tu_database(db_path="du_lieu_tau_ca.db", output_name="TONG_HOP_GHI_SO_THU_TUC.xlsx"):
    from copy import copy
    from openpyxl.utils import get_column_letter
    if not os.path.exists(db_path):
        print("Lỗi: Không tìm thấy file cơ sở dữ liệu. Hãy chạy auto_processor.py trước.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        query = "SELECT so_dang_ky, ma_tinh, lmax, hinh_thuc_kiem_tra, ngay_xu_ly, ho_ten, dia_chi, may_chinh, han_dk, nghe FROM thong_tin_tau WHERE trang_thai = 'Thành công'"
        cursor.execute(query)
        data_rows = cursor.fetchall()
        conn.close()
    except Exception as e:
        print(f"Lỗi khi đọc database: {e}")
        return

    if not data_rows:
        print("Không có dữ liệu hợp lệ trong database để xuất.")
        return

    template_path = os.path.join(os.path.dirname(__file__), "output_xl", "TỔNG HỢP GHI SỔ THỦ TỤC. 2026.xlsx")
    if os.path.exists(template_path):
        wb = openpyxl.load_workbook(template_path)
        for sheet_name in wb.sheetnames:
            if sheet_name != 'TỔNG HỢP':
                del wb[sheet_name]
        ws = wb['TỔNG HỢP']
        
        current_month = datetime.now().month
        quy_str = f"QUÝ {(current_month - 1) // 3 + 1}"
        ws.title = quy_str
        
        row_styles = []
        for cell in ws[8]:
            row_styles.append({
                'font': copy(cell.font),
                'border': copy(cell.border),
                'fill': copy(cell.fill),
                'number_format': copy(cell.number_format),
                'alignment': copy(cell.alignment)
            })
            
        tinh_list = []
        for i in range(100):
            val = ws.cell(row=6, column=18+i).value
            if val and str(val).strip():
                tinh_list.append(str(val).strip().upper())
            else:
                break
                
        max_row = ws.max_row
        if max_row >= 8:
            ws.delete_rows(8, max_row - 7)
    else:
        wb = openpyxl.Workbook()
        ws = wb.active
        
        current_month = datetime.now().month
        quy_str = f"QUÝ {(current_month - 1) // 3 + 1}"
        ws.title = quy_str

        ws.append(["ĐƠN VỊ    : CÔNG TY CP CÔNG NGHỆ CAO HOÀNG BẢO MINH"])
        ws.append(["Bộ phận   : Phòng Đăng kiểm tàu cá"])
        ws.append(["", "", "BẢNG KÊ THEO DÕI CẤP GIẤY CHỨNG NHẬN AN TOÀN KỸ THUẬT TÀU CÁ"])
        ws.append(["", "", "", f"{quy_str}, Năm {datetime.now().year}"])

        headers = [
            "TT", "Ngày-tháng", "Họ tên", "Địa chỉ", "Số ĐK", "Máy KW", 
            "Chiều dài", "Hình thức KT", "Hạn ĐK", "Nghề", 
            "HN", "TĐ", "ĐK", "GS", "L12-15", "L15-20", "L20-24"
        ]
        tinh_list = ["NA", "TH", "HY", "NB", "HT"]
        headers.extend(tinh_list)
        ws.append(headers)
        row_styles = []

    for row_data in data_rows:
        t = str(row_data[1]).strip().upper()
        if t and t not in tinh_list:
            tinh_list.append(t)
            
    if os.path.exists(template_path):
        for i in range(len(tinh_list)):
            col_letter = get_column_letter(18+i)
            ws.cell(row=6, column=18+i, value=tinh_list[i])
            ws.cell(row=5, column=18+i, value=8+i)
            try:
                ws.merge_cells(f'{col_letter}6:{col_letter}7')
            except ValueError:
                pass
        for i in range(len(tinh_list), len(tinh_list) + 5):
            ws.cell(row=6, column=18+i, value=None)
            ws.cell(row=5, column=18+i, value=None)
    else:
        for i in range(len(tinh_list)):
            ws.cell(row=5, column=18+i, value=tinh_list[i])

    for stt, row_data in enumerate(data_rows, start=1):
        so_dk, ma_tinh, lmax, hinh_thuc, ngay_xl, ho_ten, dia_chi, may_chinh, han_dk, nghe = row_data
        
        row = [None] * (17 + len(tinh_list))
        row[0] = stt
        
        try:
            ngay_dt = datetime.strptime(ngay_xl.split()[0], '%Y-%m-%d').date()
            row[1] = ngay_dt
        except:
            row[1] = datetime.now().date()
            
        row[2] = ho_ten
        row[3] = dia_chi if dia_chi else ma_tinh
        row[4] = so_dk
        row[5] = may_chinh
        row[6] = lmax
        row[7] = hinh_thuc
        row[8] = han_dk
        row[9] = nghe

        ht = str(hinh_thuc).strip()
        if ht == "Hàng năm": row[10] = 1
        elif ht == "Trên đà": row[11] = 2
        elif ht == "Định kỳ": row[12] = 3
        elif ht == "Giám sát": row[13] = 4

        try:
            cd = float(lmax)
            if 12 <= cd < 15: row[14] = 5
            elif 15 <= cd < 20: row[15] = 6
            elif 20 <= cd <= 24: row[16] = 7
        except:
            pass

        tinh = str(ma_tinh).strip().upper()
        if tinh in tinh_list:
            idx = tinh_list.index(tinh)
            row[17 + idx] = 8 + idx

        ws.append(row)
        new_row_idx = ws.max_row
        
        if row_styles:
            for col_idx, cell in enumerate(ws[new_row_idx]):
                style_idx = col_idx if col_idx < len(row_styles) else -1
                style = row_styles[style_idx]
                if style['font']: cell.font = copy(style['font'])
                if style['border']: cell.border = copy(style['border'])
                if style['fill']: cell.fill = copy(style['fill'])
                if style['alignment']: cell.alignment = copy(style['alignment'])
                if col_idx == 1:
                    cell.number_format = 'dd/mm/yyyy'
                elif style['number_format']:
                    cell.number_format = style['number_format']
        else:
            ws.cell(row=ws.max_row, column=2).number_format = 'dd/mm/yyyy'

    wb.save(output_name)
    print(f"Đã xuất thành công file: {output_name}")

if __name__ == "__main__":
    xuat_excel_tu_database()