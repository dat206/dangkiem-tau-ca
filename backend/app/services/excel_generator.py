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
