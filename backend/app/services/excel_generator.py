"""Placeholder: Excel Generator - Tạo file .xlsx báo cáo

Các hàm chính:
- generate_summary_sheet(data) -> file
- generate_quarterly_report(data, quarter, year) -> file
- create_report_zip(summary_file, quarterly_file) -> zip_file
"""
<<<<<<< Updated upstream
=======
Excel Generator Service

This module handles Excel file generation for vessel reports.
Uses openpyxl for Excel creation and returns BytesIO for streaming.
"""

from io import BytesIO
from typing import List, Dict, Any
from openpyxl import Workbook
from openpyxl.utils import get_column_letter
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

from app.utils.excel_styles import (
    register_styles,
    set_default_font,
    apply_full_border,
    apply_auto_width,
)
from app.services.data_processor import get_province_name, count_for_cell, PROVINCE_MAP

# Define the standard province order for columns
PROVINCE_CODES_ORDER = ["QN", "HP", "TB", "NĐ", "NB", "TH", "NA", "HT", "QB", "QT", "QNg"]


def get_inspection_type_label(inspection_type: str) -> str:
    """Map DB inspection type to Excel column label"""
    mapping = {
        'hang_nam': 'HN',
        'tren_da': 'TĐ',
        'dinh_ky': 'ĐK',
        'giam_sat': 'GS',
        'cai_hoan': 'BT',
        'bat_thuong': 'BT',
        'lan_dau': 'ĐM',
        'dong_moi': 'ĐM'
    }
    return mapping.get(inspection_type, "")

def get_inspection_type_number(inspection_type: str) -> str:
    """Map DB inspection type to number for Bảng Kê column 'Hình thức kiểm tra'"""
    mapping = {
        'dinh_ky': '1',
        'hang_nam': '2',
        'tren_da': '3',
        'cai_hoan': '4',
        'bat_thuong': '4'
    }
    # For others like 'dong_moi', 'giam_sat', we can return empty or '1' if we want.
    return mapping.get(inspection_type, "")

def get_length_group_label(length_group: str) -> str:
    mapping = {
        'duoi_12': '<12',
        'L12_15': 'L 12-15',
        'L15_20': 'L 15-20',
        'L20_24': 'L 20-24',
        'L24_30': 'L 24-30',
        'L30_plus': 'L ≥30'
    }
    return mapping.get(length_group, "")


def generate_vessel_excel(data: List[Any]) -> BytesIO:
    """
    Generate "Bảng kê tổng hợp" (TỔNG HỢP GHI SỔ THỦ TỤC)
    """
    wb = Workbook()
    ws = wb.active
    ws.title = "Tổng hợp ghi sổ"

    register_styles(wb)
    set_default_font(wb)
    ws.sheet_view.showGridLines = False

    inspection_codes = ["HN", "TĐ", "ĐK", "GS", "BT"]
    length_group_labels = ["L 12-15", "L 15-20", "L 20-24", "L 24-30", "L ≥30"]

    headers = [
        "STT", "Ngày, tháng", "Họ và tên", "Địa chỉ", "Số đăng ký", 
        "Máy chính (KW)", "Chiều dài", "Hình thức kiểm tra", "Hạn Đk", "NGHỀ"
    ]
    headers += inspection_codes
    headers += length_group_labels
    headers += PROVINCE_CODES_ORDER

    header_row = 1
    for col_idx, header_text in enumerate(headers, start=1):
        cell = ws.cell(row=header_row, column=col_idx)
        cell.value = header_text
        cell.style = "header_style"

    ws.row_dimensions[header_row].height = 28

    for row_idx, vessel in enumerate(data, start=2):
        ws.cell(row=row_idx, column=1, value=row_idx - 1).style = "data_number_style"

        # Date formatting for Issued Date
        cell_date = ws.cell(row=row_idx, column=2, value=vessel.issued_date)
        cell_date.style = "data_text_style"
        cell_date.number_format = "dd/mm/yyyy"

        ws.cell(row=row_idx, column=3, value=vessel.owner_name or "").style = "data_text_style"
        ws.cell(row=row_idx, column=4, value=vessel.address_short or vessel.address or "").style = "data_text_style"
        
        # Registration number
        if vessel.registration_no:
            reg_no = vessel.registration_no
        else:
            prov = vessel.province_code or "UNK"
            reg_no = f"{prov}-......-TS"
        ws.cell(row=row_idx, column=5, value=reg_no).style = "data_text_style"

        # Power
        power_cell = ws.cell(row=row_idx, column=6)
        power_value = vessel.power_kw
        if power_value:
            power_cell.value = float(power_value)
            power_cell.number_format = "#,##0"
        power_cell.style = "data_number_style"

        # Length
        lmax_cell = ws.cell(row=row_idx, column=7)
        lmax_value = vessel.lmax
        if lmax_value:
            lmax_cell.value = float(lmax_value)
            lmax_cell.number_format = "#,##0.00"
        lmax_cell.style = "data_number_style"

        # Inspection Type Number (1,2,3,4)
        ws.cell(row=row_idx, column=8, value=get_inspection_type_number(vessel.inspection_type)).style = "data_text_style"
        
        # Valid Until Date
        cell_valid = ws.cell(row=row_idx, column=9, value=vessel.valid_until)
        cell_valid.style = "data_text_style"
        cell_valid.number_format = "dd/mm/yyyy"
        
        ws.cell(row=row_idx, column=10, value=vessel.fishing_gear or "").style = "data_text_style"

        # Xs for inspection codes
        v_ins_lbl = get_inspection_type_label(vessel.inspection_type)
        for idx, code in enumerate(inspection_codes, start=11):
            cell = ws.cell(row=row_idx, column=idx)
            cell.value = "X" if code == v_ins_lbl else ""
            cell.style = "data_text_style"

        # Xs for length groups
        start_length_col = 11 + len(inspection_codes)
        v_lg_lbl = get_length_group_label(vessel.length_group)
        for idx, label in enumerate(length_group_labels, start=start_length_col):
            cell = ws.cell(row=row_idx, column=idx)
            cell.value = "X" if label == v_lg_lbl else ""
            cell.style = "data_text_style"

        # Xs for provinces
        start_province_col = start_length_col + len(length_group_labels)
        v_prov = (vessel.province_code or "").upper()
        # Handle QNg special match
        if v_prov == "QNG": v_prov = "QNg"
        for idx, prov in enumerate(PROVINCE_CODES_ORDER, start=start_province_col):
            cell = ws.cell(row=row_idx, column=idx)
            cell.value = "X" if prov == v_prov else ""
            cell.style = "data_text_style"

    total_row = len(data) + 2
    total_label = ws.cell(row=total_row, column=1)
    total_label.value = "Tổng số tàu"
    total_label.style = "total_style"
    ws.merge_cells(start_row=total_row, start_column=1, end_row=total_row, end_column=4)

    total_count = ws.cell(row=total_row, column=5)
    total_count.value = f"=COUNTA(E2:E{total_row - 1})"
    total_count.number_format = "#,##0"
    total_count.style = "total_style"

    for col_idx in range(6, len(headers) + 1):
        cell = ws.cell(row=total_row, column=col_idx)
        cell.style = "total_style"
        # Count Xs
        if col_idx >= 11:
            col_letter = get_column_letter(col_idx)
            cell.value = f'=COUNTIF({col_letter}2:{col_letter}{total_row - 1}, "X")'
            cell.number_format = "#,##0"

    ws.column_dimensions["A"].width = 6
    ws.column_dimensions["B"].width = 14
    ws.column_dimensions["C"].width = 22
    ws.column_dimensions["D"].width = 28
    ws.column_dimensions["E"].width = 20
    ws.column_dimensions["F"].width = 14
    ws.column_dimensions["G"].width = 14
    ws.column_dimensions["H"].width = 18
    ws.column_dimensions["I"].width = 14
    ws.column_dimensions["J"].width = 20

    apply_full_border(ws, start_row=header_row, end_row=total_row, start_col=1, end_col=len(headers))
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A{header_row}:{get_column_letter(len(headers))}{header_row}"

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def generate_quarterly_summary_excel(vessels: List[Any], quarter: int, year: int) -> BytesIO:
    """
    Generate "Báo cáo Quý theo tỉnh"
    Creates one sheet per province with 21 columns and specific grouping.
    """
    wb = Workbook()
    
    provinces_in_data = sorted(list(set(v.province_code for v in vessels if v.province_code)))
    
    if not provinces_in_data:
        ws = wb.active
        ws.title = "No Data"
        ws.cell(row=1, column=1, value="Không có dữ liệu trong khoảng thời gian này.")
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        return output

    # Remove default sheet
    if "Sheet" in wb.sheetnames:
        wb.remove(wb["Sheet"])

    for prov_code in provinces_in_data:
        prov_name = get_province_name(prov_code).upper()
        
        # Valid sheet name max length is 31
        sheet_title = prov_name[:31]
        ws = wb.create_sheet(title=sheet_title)
        
        register_styles(wb)
        set_default_font(wb)
        ws.sheet_view.showGridLines = False
        
        # Build Header
        # Row 1-2 Title
        ws.merge_cells("A1:U1")
        title_cell = ws["A1"]
        title_cell.value = "BÁO CÁO KẾT QUẢ THỰC HIỆN CÔNG TÁC ĐĂNG KIỂM"
        title_cell.font = Font(name="Times New Roman", size=14, bold=True)
        title_cell.alignment = Alignment(horizontal="center")
        
        ws.merge_cells("A2:U2")
        subtitle_cell = ws["A2"]
        subtitle_cell.value = f"Tại tỉnh/thành phố: {prov_name} (Tháng/Quý {quarter} - {year})"
        subtitle_cell.font = Font(name="Times New Roman", size=12, italic=True)
        subtitle_cell.alignment = Alignment(horizontal="center")
        
        # Main Headers (Rows 4,5,6)
        # Column mapping: 
        # 1: STT, 2: Nhóm tàu theo chiều dài Lmax (m), 3: Tổng số tàu KT
        # 4-7: Tàu cá gỗ (Tổng, Định kỳ, Hàng năm, Cải hoán)
        # 8-11: Tàu vỏ thép
        # 12-15: Vật liệu mới FRP
        # 16: Số lượng tàu đóng mới (Gỗ, Thép, FRP) - 16, 17, 18
        # 19: Lập hồ sơ đăng kiểm
        # 20: Giấy chứng nhận ATKT được cấp
        # 21: Ghi chú
        
        header_fill = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
        header_font = Font(name="Times New Roman", size=11, bold=True)
        header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
        
        def write_h(r, c, val):
            cell = ws.cell(row=r, column=c, value=val)
            cell.font = header_font
            cell.alignment = header_align
            cell.fill = header_fill

        # Merge Setup
        ws.merge_cells("A4:A6"); write_h(4, 1, "STT")
        ws.merge_cells("B4:B6"); write_h(4, 2, "Nhóm tàu theo chiều dài Lmax (m)")
        ws.merge_cells("C4:C6"); write_h(4, 3, "Tổng số tàu được KT")
        
        ws.merge_cells("D4:G4"); write_h(4, 4, "Tàu cá vỏ gỗ")
        ws.merge_cells("H4:K4"); write_h(4, 8, "Tàu vỏ thép")
        ws.merge_cells("L4:O4"); write_h(4, 12, "Tàu vật liệu mới (FRP)")
        
        for base_col in [4, 8, 12]:
            ws.merge_cells(start_row=5, start_column=base_col, end_row=6, end_column=base_col)
            write_h(5, base_col, "Tổng số")
            ws.merge_cells(start_row=5, start_column=base_col+1, end_row=5, end_column=base_col+3)
            write_h(5, base_col+1, "Trong đó")
            write_h(6, base_col+1, "Định kỳ")
            write_h(6, base_col+2, "Hàng năm")
            write_h(6, base_col+3, "Cải hoán")
            
        ws.merge_cells("P4:R4"); write_h(4, 16, "Số lượng tàu đóng mới")
        ws.merge_cells("P5:P6"); write_h(5, 16, "Gỗ")
        ws.merge_cells("Q5:Q6"); write_h(5, 17, "Thép")
        ws.merge_cells("R5:R6"); write_h(5, 18, "FRP")
        
        ws.merge_cells("S4:S6"); write_h(4, 19, "Lập hồ sơ đăng kiểm")
        ws.merge_cells("T4:T6"); write_h(4, 20, "Giấy CN ATKT được cấp")
        ws.merge_cells("U4:U6"); write_h(4, 21, "Ghi chú")
        
        # Fill empty merged cells to apply styles
        for r in range(4, 7):
            for c in range(1, 22):
                cell = ws.cell(row=r, column=c)
                if not cell.value:
                    cell.font = header_font
                    cell.alignment = header_align
                    cell.fill = header_fill

        # Column widths
        ws.column_dimensions['A'].width = 6
        ws.column_dimensions['B'].width = 18
        ws.column_dimensions['C'].width = 12
        for col_idx in range(4, 21):
            ws.column_dimensions[get_column_letter(col_idx)].width = 10
        ws.column_dimensions['U'].width = 15

        # Data Rows
        # Groups: L12_15, L15_20, L20_24, L24_30, L30_plus
        length_groups = [
            ('L12_15', 'Tàu có Lmax từ 12- dưới 15m'),
            ('L15_20', 'Tàu có Lmax từ 15- dưới 20m'),
            ('L20_24', 'Tàu có Lmax từ 20- dưới 24m'),
            ('L24_30', 'Tàu có Lmax từ 24- dưới 30m'),
            ('L30_plus', 'Tàu có Lmax từ 30 trở lên'),
        ]
        
        materials = ['Gỗ', 'Thép', 'FRP']
        insp_cats = ['ALL', 'dinh_ky', 'hang_nam', 'cai_hoan']
        
        current_row = 7
        for idx, (lg_code, lg_name) in enumerate(length_groups, start=1):
            # STT
            c_stt = ws.cell(row=current_row, column=1, value=idx)
            c_stt.alignment = Alignment(horizontal="center")
            
            # Name
            c_name = ws.cell(row=current_row, column=2, value=lg_name)
            
            # Calculations
            cells_to_write = {}
            col_offset = 4
            row_total = 0
            
            for mat in materials:
                for icat in insp_cats:
                    val = count_for_cell(vessels, prov_code, lg_code, mat, icat)
                    cells_to_write[col_offset] = val
                    if icat == 'ALL':
                        row_total += val
                    col_offset += 1
            
            # Total
            c_tot = ws.cell(row=current_row, column=3, value=row_total)
            c_tot.alignment = Alignment(horizontal="center")
            
            # Write material cells
            for c_idx, val in cells_to_write.items():
                c_val = ws.cell(row=current_row, column=c_idx, value=val if val > 0 else "")
                c_val.alignment = Alignment(horizontal="center")
                
            # Dong moi
            dm_go = count_for_cell(vessels, prov_code, lg_code, 'Gỗ', 'dong_moi')
            dm_thep = count_for_cell(vessels, prov_code, lg_code, 'Thép', 'dong_moi')
            dm_frp = count_for_cell(vessels, prov_code, lg_code, 'FRP', 'dong_moi')
            ws.cell(row=current_row, column=16, value=dm_go if dm_go > 0 else "").alignment = Alignment(horizontal="center")
            ws.cell(row=current_row, column=17, value=dm_thep if dm_thep > 0 else "").alignment = Alignment(horizontal="center")
            ws.cell(row=current_row, column=18, value=dm_frp if dm_frp > 0 else "").alignment = Alignment(horizontal="center")
            
            current_row += 1
            
        # TONG CONG
        c_tot_stt = ws.cell(row=current_row, column=1, value="")
        c_tot_name = ws.cell(row=current_row, column=2, value="TỔNG CỘNG")
        c_tot_name.font = Font(name="Times New Roman", size=11, bold=True)
        
        for c in range(3, 21):
            col_letter = get_column_letter(c)
            c_tot_val = ws.cell(row=current_row, column=c, value=f"=SUM({col_letter}7:{col_letter}{current_row-1})")
            c_tot_val.font = Font(name="Times New Roman", size=11, bold=True)
            c_tot_val.alignment = Alignment(horizontal="center")

        apply_full_border(ws, start_row=4, end_row=current_row, start_col=1, end_col=21)

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output


>>>>>>> Stashed changes
