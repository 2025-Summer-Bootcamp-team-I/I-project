from fastapi import APIRouter, UploadFile, File
import os
import shutil
from app.rag.service import embed_pdf_to_chroma

router = APIRouter(prefix="/rag", tags=["RAG"])

@router.post("/upload_pdf")
async def upload_and_embed_pdf(file: UploadFile = File(...)):
    """업로드된 PDF를 임베딩하고 결과를 반환합니다."""
    temp_dir = "temp"
    os.makedirs(temp_dir, exist_ok=True)
    save_path = os.path.join(temp_dir, file.filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = embed_pdf_to_chroma(save_path)
    return {"message": "Embedding complete", "result": result}
