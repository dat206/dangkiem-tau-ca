"""
Excel Generator Service

This module handles Excel file generation for vessel reports.
Uses openpyxl for Excel creation and returns BytesIO for streaming.
"""

from io import BytesIO
from typing import List, Dict, Any
from openpyxl import Workbook
from openpyxl.utils import get_column_letter

from app.utils.excel_styles import (
    register_styles,
    set_default_font,
    apply_full_border,
    apply_auto_width,
)


def generate_vessel_excel(data: List[Dict[str, Any]]) -> BytesIO:
    """
    Generate an Excel file containing vessel data.
    
    Creates a professional Excel report with headers, data rows, borders,
    and a summary row with formulas. The file is returned as BytesIO
    for direct streaming to the client.
    
    Args:
        data: List of dictionaries containing vessel information.
              Expected keys: registration_no, owner, lmax, engine_power
              
              Example:
              [
                  {
                      "registration_no": "TH-001",
                      "owner": "Nguyen Van A",
                      "lmax": 15.5,
                      "engine_power": 450
                  }
              ]
    
    Returns:
        BytesIO: Excel file content as BytesIO object, ready for streaming.
                 Call seek(0) before reading if needed.
    
    Raises:
        ValueError: If data is empty or contains invalid structures.
    """
    # ==================== Workbook Initialization ====================
    wb = Workbook()
    ws = wb.active
    ws.title = "Bao cao tau ca"
    
    # Setup workbook defaults
    register_styles(wb)
    set_default_font(wb)
    
    # Configure worksheet appearance
    ws.sheet_view.showGridLines = False  # Professional appearance without gridlines
    wb.active = 0
    
    # ==================== Header Row ====================
    headers = ["STT", "Số đăng ký", "Chủ tàu", "Lmax", "Công suất máy"]
    header_row = 1
    num_columns = len(headers)
    
    for col_idx, header_text in enumerate(headers, start=1):
        cell = ws.cell(row=header_row, column=col_idx)
        cell.value = header_text
        cell.style = "header_style"
    
    # Set header row height for better appearance
    ws.row_dimensions[header_row].height = 25
    
    # ==================== Column Index Constants ====================
    STT_COL = 1
    REGISTRATION_COL = 2
    OWNER_COL = 3
    LMAX_COL = 4
    ENGINE_POWER_COL = 5
    
    # ==================== Data Rows ====================
    for row_idx, vessel in enumerate(data, start=2):
        # STT (Serial Number) - auto-numbered from 1 to n
        stt_cell = ws.cell(row=row_idx, column=STT_COL)
        stt_cell.value = row_idx - 1  # STT starts from 1 for row 2
        stt_cell.style = "data_number_style"  # Centers the number
        
        # Registration Number - text, left-aligned
        reg_cell = ws.cell(row=row_idx, column=REGISTRATION_COL)
        reg_cell.value = vessel.get("registration_no", "")
        reg_cell.style = "data_text_style"
        
        # Owner Name - text, left-aligned
        owner_cell = ws.cell(row=row_idx, column=OWNER_COL)
        owner_cell.value = vessel.get("owner", "")
        owner_cell.style = "data_text_style"
        
        # Lmax (Maximum Length) - number with decimals, center-aligned
        lmax_cell = ws.cell(row=row_idx, column=LMAX_COL)
        lmax_value = vessel.get("lmax")
        if lmax_value is not None:
            lmax_cell.value = float(lmax_value)
            lmax_cell.number_format = "#,##0.00"  # Format with 2 decimals
        lmax_cell.style = "data_number_style"
        
        # Engine Power - integer number, center-aligned
        power_cell = ws.cell(row=row_idx, column=ENGINE_POWER_COL)
        power_value = vessel.get("engine_power")
        if power_value is not None:
            power_cell.value = int(power_value)
            power_cell.number_format = "#,##0"  # Format with thousand separator
        power_cell.style = "data_number_style"
    
    # ==================== Total Row ====================
    total_row = len(data) + 2
    
    # Total label in first column
    total_label_cell = ws.cell(row=total_row, column=STT_COL)
    total_label_cell.value = "Tổng số tàu"
    total_label_cell.style = "total_style"
    
    # Total count using COUNTA formula - counts non-empty cells in registration column
    total_count_cell = ws.cell(row=total_row, column=REGISTRATION_COL)
    total_count_cell.value = f"=COUNTA(B2:B{total_row - 1})"
    total_count_cell.number_format = "#,##0"
    total_count_cell.style = "total_style"
    
    # Apply total_style to remaining cells in total row
    for col_idx in range(3, num_columns + 1):
        total_cell = ws.cell(row=total_row, column=col_idx)
        total_cell.style = "total_style"
    
    # ==================== Column Width Setup ====================
    # Set fixed width for STT column (6 units for single/double digit numbers)
    ws.column_dimensions['A'].width = 6
    
    # Auto-adjust width for other columns
    # Skip column A (STT) to maintain fixed width
    apply_auto_width(ws, skip_columns=["A"], padding=2.0, max_width=50.0)
    
    # ==================== Apply Borders ====================
    # Apply complete borders to the entire data range
    # Includes header, all data rows, and total row
    apply_full_border(
        ws,
        start_row=header_row,
        end_row=total_row,
        start_col=1,
        end_col=num_columns,
    )
    
    # ==================== Freeze Panes ====================
    # Freeze header row so it remains visible when scrolling
    ws.freeze_panes = "A2"
    
    # ==================== Auto Filter ====================
    # Add filter dropdown to header row
    ws.auto_filter.ref = f"A{header_row}:{get_column_letter(num_columns)}{header_row}"
    
    # ==================== Export to BytesIO ====================
    # Create BytesIO object for streaming without saving to disk
    output = BytesIO()
    wb.save(output)
    output.seek(0)  # Reset pointer to beginning for reading
    
    return output


def generate_quarterly_summary_excel(aggregated_data: Dict[str, Any], quarter: int, year: int) -> BytesIO:
    """
    Generate a summary Excel report with aggregated vessel statistics.
    
    Creates a professional multi-table Excel sheet showing distributions
    by province, length group, material, and inspection type.
    """
    wb = Workbook()
    ws = wb.active
    ws.title = "Bao cao thong ke"
    
    register_styles(wb)
    set_default_font(wb)
    ws.sheet_view.showGridLines = False
    
    # Title
    ws.merge_cells("A1:C1")
    title_cell = ws["A1"]
    title_cell.value = f"BÁO CÁO THỐNG KÊ ĐĂNG KIỂM TÀU CÁ - QUÝ {quarter}/{year}"
    from openpyxl.styles import Font
    title_cell.font = Font(name="Arial", size=14, bold=True, color="0B5345")
    ws.row_dimensions[1].height = 30
    
    current_row = 3
    
    def write_table(title: str, headers: List[str], data_dict: Dict[str, int]):
        nonlocal current_row
        # Table Title
        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=3)
        t_cell = ws.cell(row=current_row, column=1)
        t_cell.value = title
        t_cell.font = Font(name="Arial", size=11, bold=True, color="117A65")
        ws.row_dimensions[current_row].height = 20
        current_row += 1
        
        # Headers
        for col_idx, h_text in enumerate(headers, start=1):
            cell = ws.cell(row=current_row, column=col_idx)
            cell.value = h_text
            cell.style = "header_style"
        ws.row_dimensions[current_row].height = 22
        start_table_row = current_row
        current_row += 1
        
        # Rows
        for idx, (key, val) in enumerate(data_dict.items(), start=1):
            c1 = ws.cell(row=current_row, column=1, value=idx)
            c1.style = "data_number_style"
            
            c2 = ws.cell(row=current_row, column=2, value=key)
            c2.style = "data_text_style"
            
            c3 = ws.cell(row=current_row, column=3, value=val)
            c3.style = "data_number_style"
            
            ws.row_dimensions[current_row].height = 20
            current_row += 1
            
        # Total row
        c1_tot = ws.cell(row=current_row, column=1, value="Tổng")
        c1_tot.style = "total_style"
        
        c2_tot = ws.cell(row=current_row, column=2, value="")
        c2_tot.style = "total_style"
        
        c3_tot = ws.cell(row=current_row, column=3, value=f"=SUM(C{start_table_row + 1}:C{current_row - 1})")
        c3_tot.style = "total_style"
        c3_tot.number_format = "#,##0"
        
        ws.row_dimensions[current_row].height = 22
        
        # Apply borders
        apply_full_border(ws, start_row=start_table_row, end_row=current_row, start_col=1, end_col=3)
        current_row += 2  # spacing
        
    write_table("1. THỐNG KÊ THEO TỈNH THÀNH", ["STT", "Tỉnh / Thành phố", "Số lượng tàu"], aggregated_data.get("by_province", {}))
    write_table("2. THỐNG KÊ THEO PHÂN NHÓM CHIỀU DÀI LMAX", ["STT", "Nhóm chiều dài Lmax", "Số lượng tàu"], aggregated_data.get("by_length_group", {}))
    write_table("3. THỐNG KÊ THEO VẬT LIỆU VỎ TÀU", ["STT", "Vật liệu vỏ", "Số lượng tàu"], aggregated_data.get("by_material", {}))
    write_table("4. THỐNG KÊ THEO HÌNH THỨC KIỂM TRA", ["STT", "Hình thức kiểm tra", "Số lượng tàu"], aggregated_data.get("by_inspection_type", {}))
    
    # Width setup
    ws.column_dimensions['A'].width = 8
    ws.column_dimensions['B'].width = 30
    ws.column_dimensions['C'].width = 18
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output

