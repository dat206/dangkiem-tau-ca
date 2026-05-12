from fastapi import APIRouter, UploadFile, File

router = APIRouter()

@router.post("/generate-report")
async def generate_report(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "content_type": file.content_type
    }