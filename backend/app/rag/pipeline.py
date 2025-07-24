#app/rag/pipeline.py
import os
import requests
import shutil
import time
import gzip
from dotenv import load_dotenv
from pypdf.errors import PdfStreamError
from app.rag.service import embed_pdf_to_chroma

load_dotenv()
SEMANTIC_SCHOLAR_API_KEY = os.getenv("SEMANTIC_SCHOLAR_API_KEY")

MIN_YEAR = 2018
MIN_CITATIONS = 50
TEMP_DIR = "temp"

QUERIES = [
    "dementia screening questions",
    "dementia conversational assessment",
    "dementia interview protocol",
    "cognitive impairment dialogue assessment",
    "dementia language assessment",
    "dementia verbal fluency test",
    "dementia clinical interview",
    "cognitive screening conversation",
    "dementia diagnostic questions",
    "dementia symptom conversation",
    "linguistic markers of dementia",
    "discourse analysis in dementia",
    "narrative assessment in dementia",
    "pragmatic language in dementia",
    "communication assessment in dementia",
    "MMSE dementia",
    "MoCA dementia",
    "AD8 dementia",
    "verbal fluency dementia",
    "story recall dementia",
    "picture description dementia"
]

def bulk_search_scholar(query, limit=100):
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    headers = {"x-api-key": SEMANTIC_SCHOLAR_API_KEY}
    params = {
        "query": query,
        "limit": min(limit, 100),
        "fields": "title,openAccessPdf,year,citationCount"
    }
    resp = requests.get(url, headers=headers, params=params)
    resp.raise_for_status()
    data = resp.json().get("data", [])
    data.sort(key=lambda x: x.get("citationCount", 0), reverse=True)
    return data

def filter_by_year_citations(papers):
    result = []
    for p in papers:
        year = p.get("year") if isinstance(p.get("year"), int) else 0
        if (
                year >= MIN_YEAR
                and p.get("citationCount", 0) >= MIN_CITATIONS
                and p.get("openAccessPdf", {}).get("url")
        ):
            result.append(p)
    return result

def download_pdf(paper, save_dir=TEMP_DIR):
    os.makedirs(save_dir, exist_ok=True)
    url = paper["openAccessPdf"]["url"]

    # 파일명 = 논문 제목 기반으로 안전하게 구성
    title = paper.get("title", "제목 없음").strip()
    safe_title = "".join(c for c in title if c.isalnum() or c in " _-").rstrip()
    filename = os.path.join(save_dir, f"{safe_title}.pdf")

    try:
        r = requests.get(url, stream=True)
        if r.status_code == 403:
            print("403 Forbidden:", url, "건너뜀")
            return None
        r.raise_for_status()
        with open(filename, "wb") as f:
            shutil.copyfileobj(r.raw, f)
    except Exception as e:
        print("다운로드 실패:", url, e)
        return None

    # gzip 압축 해제
    with open(filename, "rb") as f:
        hdr = f.read(2)
    if hdr == b"\x1f\x8b":
        try:
            data = gzip.decompress(open(filename, "rb").read())
            newname = filename.rstrip(".gz")
            with open(newname, "wb") as f:
                f.write(data)
            filename = newname
        except Exception as e:
            print("gzip 해제 실패:", filename, e)
            return None

    # PDF 헤더 검증
    with open(filename, "rb") as f:
        if not f.read(4).startswith(b"%PDF"):
            print("invalid pdf header:", filename)
            return None

    return filename

def run_pipeline():
    seen = set()
    all_papers = []

    for query in QUERIES:
        print(f"=== 검색 쿼리: {query} ===")
        papers = bulk_search_scholar(query, limit=200)
        print(f"수집 논문 수: {len(papers)}")
        for p in papers:
            title = p.get("title", "").strip().lower()
            if title and title not in seen:
                seen.add(title)
                all_papers.append(p)
        time.sleep(2)

    print(f"전체 고유 논문 수: {len(all_papers)}")
    filtered = filter_by_year_citations(all_papers)
    print(f"필터 통과 논문 수: {len(filtered)}")

    total = 0
    for paper in filtered:
        path = download_pdf(paper)
        if not path:
            continue
        print(f"다운로드 완료: {path}")
        try:
            title = paper.get("title", "제목 없음").strip()
            result = embed_pdf_to_chroma(path, title=title)
            print(f"임베딩 결과: {result}")
            # ChromaDB 연결 실패 시에도 성공으로 카운트 (예외처리되어 있음)
            if "ChromaDB 연결 실패" in result:
                print("ChromaDB 연결 실패로 임베딩을 건너뜁니다.")
            else:
                total += 1
        except PdfStreamError as e:
            print("PDF 파싱 에러 건너뜀:", path, e)
        except Exception as e:
            print("임베딩 에러 건너뜀:", path, e)

    print(f"전체 처리 논문 수: {total}")

if __name__ == "__main__":
    run_pipeline()
