#!/usr/bin/env python3
"""
기존 로컬 드로잉 이미지들을 S3로 마이그레이션하는 스크립트
"""

import os
import sys
import requests
from pathlib import Path

# 프로젝트 루트 경로 추가
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from app.database import get_db, engine
from app.drawing.models import DrawingTest
from app.drawing.s3_utils import save_file_to_s3, delete_file_from_s3
from sqlalchemy.orm import Session
import asyncio

async def migrate_drawings_to_s3():
    """
    기존 로컬 드로잉 이미지들을 S3로 마이그레이션
    """
    print("드로잉 이미지 S3 마이그레이션을 시작합니다...")
    
    # DB 세션 생성
    db = next(get_db())
    
    try:
        # 로컬 이미지 URL을 가진 드로잉 테스트 조회
        local_drawings = db.query(DrawingTest).filter(
            DrawingTest.image_url.like('/static/uploads/drawings/%')
        ).all()
        
        print(f"총 {len(local_drawings)}개의 로컬 이미지를 발견했습니다.")
        
        migrated_count = 0
        failed_count = 0
        
        for drawing in local_drawings:
            try:
                # 로컬 파일 경로
                local_path = os.path.join("/app", drawing.image_url.lstrip("/"))
                
                if not os.path.exists(local_path):
                    print(f"파일이 존재하지 않습니다: {local_path}")
                    failed_count += 1
                    continue
                
                # 파일을 S3에 업로드
                print(f"업로드 중: {drawing.image_url}")
                
                # 파일을 UploadFile 객체로 시뮬레이션
                class MockUploadFile:
                    def __init__(self, file_path):
                        self.file_path = file_path
                        self.filename = os.path.basename(file_path)
                        self.content_type = 'image/png'
                    
                    @property
                    def file(self):
                        return open(self.file_path, 'rb')
                
                mock_file = MockUploadFile(local_path)
                
                # S3에 업로드
                s3_url = await save_file_to_s3(mock_file)
                
                # DB 업데이트
                drawing.image_url = s3_url
                db.commit()
                
                print(f"성공: {drawing.image_url} -> {s3_url}")
                migrated_count += 1
                
                # 로컬 파일 삭제 (선택사항)
                # os.remove(local_path)
                # print(f"로컬 파일 삭제: {local_path}")
                
            except Exception as e:
                print(f"실패: {drawing.image_url} - {str(e)}")
                failed_count += 1
                db.rollback()
        
        print(f"\n마이그레이션 완료:")
        print(f"- 성공: {migrated_count}개")
        print(f"- 실패: {failed_count}개")
        
    except Exception as e:
        print(f"마이그레이션 중 오류 발생: {str(e)}")
        db.rollback()
    finally:
        db.close()

def verify_migration():
    """
    마이그레이션 결과 검증
    """
    print("\n마이그레이션 결과를 검증합니다...")
    
    db = next(get_db())
    
    try:
        # S3 URL을 가진 드로잉 테스트 조회
        s3_drawings = db.query(DrawingTest).filter(
            DrawingTest.image_url.like('https://%')
        ).all()
        
        print(f"S3 이미지: {len(s3_drawings)}개")
        
        # 로컬 URL을 가진 드로잉 테스트 조회
        local_drawings = db.query(DrawingTest).filter(
            DrawingTest.image_url.like('/static/uploads/drawings/%')
        ).all()
        
        print(f"로컬 이미지: {len(local_drawings)}개")
        
        # S3 URL 접근 가능성 테스트
        accessible_count = 0
        for drawing in s3_drawings[:5]:  # 처음 5개만 테스트
            try:
                response = requests.head(drawing.image_url, timeout=5)
                if response.status_code == 200:
                    accessible_count += 1
                    print(f"✓ 접근 가능: {drawing.image_url}")
                else:
                    print(f"✗ 접근 불가: {drawing.image_url} (상태코드: {response.status_code})")
            except Exception as e:
                print(f"✗ 접근 불가: {drawing.image_url} (오류: {str(e)})")
        
        print(f"\nS3 접근 테스트 결과: {accessible_count}/5개 접근 가능")
        
    except Exception as e:
        print(f"검증 중 오류 발생: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="드로잉 이미지 S3 마이그레이션")
    parser.add_argument("--verify", action="store_true", help="마이그레이션 결과만 검증")
    
    args = parser.parse_args()
    
    if args.verify:
        verify_migration()
    else:
        asyncio.run(migrate_drawings_to_s3())
        verify_migration() 