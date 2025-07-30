import os
import uuid
import boto3
import asyncio
from botocore.exceptions import ClientError
from fastapi import UploadFile
from dotenv import load_dotenv

# .env 파일 로드
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(env_path)

# S3 설정
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-2")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# S3 클라이언트 초기화
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

async def save_file_to_s3(file: UploadFile, subdir: str = "drawings") -> str:
    """
    업로드된 파일을 S3에 저장하고, S3 URL을 반환합니다.
    
    Args:
        file: 업로드된 파일
        subdir: S3 내 하위 디렉토리 (기본값: "drawings")
        
    Returns:
        str: S3에서 접근 가능한 URL
    """
    if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME]):
        raise ValueError("S3 설정이 완료되지 않았습니다. AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME을 확인해주세요.")

    # 파일 확장자 추출 (없으면 기본 .png)
    file_extension = ".png"
    if file.filename:
        _, ext = os.path.splitext(file.filename)
        if ext:
            file_extension = ext.lower()

    # 유니크 파일명 생성
    file_name = f"{uuid.uuid4()}{file_extension}"
    s3_key = f"{subdir}/{file_name}"

    try:

        # 파일을 S3에 업로드 (비동기 처리)
        await asyncio.to_thread(
            s3_client.upload_fileobj,
            file.file,
            S3_BUCKET_NAME,
            s3_key,
            ExtraArgs={
                'ContentType': file.content_type or 'image/png'
                # ACL 제거 - 버킷이 ACL을 지원하지 않음
            }
        )

        # S3 URL 생성
        s3_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        return s3_url

    except ClientError as e:
        raise Exception(f"S3 업로드 실패: {str(e)}")
    except Exception as e:
        raise Exception(f"파일 업로드 중 오류 발생: {str(e)}")


async def delete_file_from_s3(s3_url: str) -> bool:
    """
    S3에서 파일을 삭제합니다.

    Args:
        s3_url: 삭제할 파일의 S3 URL

    Returns:
        bool: 삭제 성공 여부
    """
    try:
        # URL에서 버킷명과 키 추출
        # https://bucket-name.s3.region.amazonaws.com/path/to/file
        url_parts = s3_url.replace("https://", "").split("/")
        bucket_name = url_parts[0].split('.s3.')[0]
        s3_key = "/".join(url_parts[1:])


        # 파일 삭제 (비동기 처리)
        await asyncio.to_thread(
            s3_client.delete_object,
            Bucket=bucket_name,
            Key=s3_key
        )
        return True

    except ClientError as e:
        print(f"S3 파일 삭제 실패: {str(e)}")
        return False
    except Exception as e:
        print(f"파일 삭제 중 오류 발생: {str(e)}")
        return False

def generate_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    try:
        return s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': S3_BUCKET_NAME,
                'Key': s3_key
            },
            ExpiresIn=expiration
        )
    except Exception as e:
        raise Exception(f"Presigned URL 생성 실패: {str(e)}")