"""
Report Router

Handles all report generation endpoints, including Excel export for vessel data.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import logging

from app.services.excel_generator import generate_vessel_excel


# Logger setup
logger = logging.getLogger(__name__)

# Create router with /api prefix
router = APIRouter(prefix="/api", tags=["reports"])


# ==================== Service Functions ====================
def _get_vessel_data() -> List[Dict[str, Any]]:
    """
    Retrieve vessel data from database or mock data.
    
    This function separates data retrieval logic from the endpoint handler,
    making it easier to:
    - Switch from mock data to database queries
    - Add filtering and pagination
    - Add caching
    - Test independently
    
    Returns:
        List[Dict[str, Any]]: List of vessel records with keys:
                              - registration_no: str
                              - owner: str
                              - lmax: float
                              - engine_power: int
    
    Note:
        Currently returns mock data. Replace with database query when ready:
        
        from app.database import SessionLocal
        from app.models.vessel import Vessel
        
        db = SessionLocal()
        vessels = db.query(Vessel).all()
        return [v.to_dict() for v in vessels]
    """
    # Mock data - replace with database query when ready
    mock_data = [
        {
            "registration_no": "TH-001",
            "owner": "Nguyễn Văn A",
            "lmax": 15.5,
            "engine_power": 450,
        },
        {
            "registration_no": "TH-002",
            "owner": "Trần Văn B",
            "lmax": 12.3,
            "engine_power": 300,
        },
        {
            "registration_no": "TH-003",
            "owner": "Phạm Thị C",
            "lmax": 18.7,
            "engine_power": 550,
        },
        {
            "registration_no": "TH-004",
            "owner": "Võ Minh D",
            "lmax": 14.2,
            "engine_power": 380,
        },
    ]
    
    return mock_data


def _export_vessel_report(data: Optional[List[Dict[str, Any]]] = None) -> StreamingResponse:
    """
    Generate and stream vessel Excel report.
    
    This function handles the export logic separately from the endpoint,
    allowing it to be reused in different contexts (async tasks, batch exports, etc.).
    
    Args:
        data: Optional list of vessel data. If None, fetches from _get_vessel_data().
              Allows for testing with custom data.
    
    Returns:
        StreamingResponse: Excel file as streaming response, ready to download.
    
    Raises:
        HTTPException: If Excel generation fails.
    """
    try:
        # Get data if not provided
        if data is None:
            data = _get_vessel_data()
        
        # Generate Excel file
        excel_bytes = generate_vessel_excel(data)
        
        # Create streaming response with proper headers
        return StreamingResponse(
            iter([excel_bytes.getvalue()]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": "attachment; filename=Bao-cao-tau-ca.xlsx"
            },
        )
    
    except Exception as e:
        logger.error(f"Error generating vessel report: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi tạo báo cáo: {str(e)}"
        )


# ==================== Endpoints ====================
@router.post("/generate-report")
async def generate_report() -> StreamingResponse:
    """
    Generate and download vessel report as Excel file.
    
    This endpoint retrieves vessel data and generates a formatted Excel report.
    The file is automatically downloaded to the client's default download folder.
    
    Returns:
        StreamingResponse: Excel file (.xlsx) with complete formatting.
        
    Raises:
        HTTPException 500: If report generation fails.
    
    Example:
        >>> # Frontend call
        >>> const response = await fetch("/api/generate-report", {
        >>>     method: "POST"
        >>> });
        >>> const blob = await response.blob();
        >>> // Browser automatically downloads as Bao-cao-tau-ca.xlsx
    """
    return _export_vessel_report()


# ==================== Additional Endpoints (Optional Future Use) ====================
@router.post("/generate-report/custom")
async def generate_custom_report(data: List[Dict[str, Any]]) -> StreamingResponse:
    """
    Generate vessel report with custom data.
    
    Useful for testing and advanced scenarios where you want to
    generate reports with specific filtered or transformed data.
    
    Args:
        data: List of vessel dictionaries to include in the report.
    
    Returns:
        StreamingResponse: Excel file with custom data.
    
    Raises:
        HTTPException 500: If report generation fails.
    
    Example:
        >>> data = [
        >>>     {
        >>>         "registration_no": "TH-001",
        >>>         "owner": "Nguyen Van A",
        >>>         "lmax": 15.5,
        >>>         "engine_power": 450
        >>>     }
        >>> ]
        >>> POST /api/generate-report/custom with JSON body
    """
    return _export_vessel_report(data=data)