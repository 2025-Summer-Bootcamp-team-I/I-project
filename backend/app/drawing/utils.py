import os
from fastapi import UploadFile
import uuid
import shutil

async def save_file_locally(file: UploadFile) -> str:
    # Docker 컨테이너 내부의 절대 경로 사용
    upload_dir = os.path.join("/app", "static", "uploads", "drawings")
    os.makedirs(upload_dir, exist_ok=True)
    
    # 파일 확장자 추출 (기본값 .png)
    file_extension = '.png'
    if file.filename:
        _, ext = os.path.splitext(file.filename)
        if ext:
            file_extension = ext
    
    # 유니크한 파일명 생성
    file_name = f"{str(uuid.uuid4())}{file_extension}"
    file_path = os.path.join(upload_dir, file_name)
    
    # 파일 저장
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # URL 경로 반환 (앞에 슬래시 추가)
    return f"/static/uploads/drawings/{file_name}" 