import os
import uuid
import shutil
from fastapi import UploadFile

async def save_file_locally(file: UploadFile, subdir: str = "drawings") -> str:
    """
    업로드된 파일을 서버 로컬의 static/uploads/<subdir>/ 폴더에 저장하고,
    웹에서 접근 가능한 경로(/static/uploads/<subdir>/파일명)를 반환.
    """
    # 업로드 폴더 설정
    base_upload_dir = os.path.join("/app", "static", "uploads")
    upload_dir = os.path.join(base_upload_dir, subdir)
    os.makedirs(upload_dir, exist_ok=True)
    
    # 파일 확장자 추출 (없으면 기본 .png)
    file_extension = ".png"
    if file.filename:
        _, ext = os.path.splitext(file.filename)
        if ext:
            file_extension = ext.lower()

    # 유니크 파일명 생성
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, file_name)

    # 실제 파일 저장
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 웹에서 접근 가능한 URL 경로 반환 (앞에 슬래시 포함)
    return f"/static/uploads/{subdir}/{file_name}"
