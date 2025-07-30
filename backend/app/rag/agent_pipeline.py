import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage, HumanMessage
from langchain.agents.format_scratchpad.openai_tools import format_to_openai_tool_messages
from langchain.agents.output_parsers.openai_tools import OpenAIToolsAgentOutputParser
from langchain.agents import tool

# 기존 파이프라인에서 함수들을 가져옵니다.
from app.rag.pipeline import bulk_search_scholar, filter_by_year_citations, download_pdf
from app.rag.service import embed_pdf_to_chroma
from pypdf.errors import PdfStreamError

@tool
def search_for_papers(query: str, limit: int = 10) -> list[dict]:
    """
    주어진 쿼리로 학술 논문을 검색하고, 인용 횟수와 연도를 기준으로 필터링하여
    다운로드 가능한 PDF가 있는 논문 목록을 반환합니다.
    """
    print(f"TOOL: Searching for papers with query: '{query}'")
    papers = bulk_search_scholar(query, limit=limit)
    filtered = filter_by_year_citations(papers)
    return [
        {"title": p.get("title"), "paperId": p.get("paperId"), "url": p.get("openAccessPdf", {}).get("url"), "metadata": p}
        for p in filtered
    ]

@tool
def download_and_embed(paper_info: dict) -> str:
    """
    paper_info: search_for_papers에서 반환된 dict (title, url, metadata)
    PDF를 다운로드하고 ChromaDB에 임베딩합니다.
    """
    metadata = paper_info.get("metadata", {})
    title = metadata.get("title", "제목 없음")
    print(f"TOOL: Downloading and embedding '{title}'")
    path = download_pdf(metadata)
    if not path:
        return f"다운로드 실패: {title}"
    try:
        result = embed_pdf_to_chroma(path, title=title)
        return f"임베딩 완료: {result}"
    except PdfStreamError as e:
        return f"PDF 파싱 에러: {e}"
    except Exception as e:
        return f"임베딩 에러: {e}"


def run_agent_pipeline():
    # 1. 에이전트 설정
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest", temperature=0)
    tools = [search_for_papers, download_and_embed]

    # 2. 프롬프트 설정
    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "당신은 dementia(치매) 연구 전문가입니다. "
         "목표는 신뢰성 있는(peer-reviewed) 고품질 논문을 사용해 "
         "대화를 기반으로 치매 가능성을 탐지하는 기능과 "
         "MMSE 기반 질문 개발 및 이들의 평가 연구 자료를 확보하는 것입니다. "
         "먼저 관련 search queries(검색 쿼리)를 생성하세요. "
         "그다음 search_for_papers tool(도구)로 논문 메타데이터를 수집하고 "
         "download_and_embed tool(도구)로 PDF 다운로드와 임베딩을 수행하세요. "
         "마지막으로 주요 논문 제목, 평가 지표, 임베딩 상태를 요약해 제공하세요."
         ),
        ("user", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    llm_with_tools = llm.bind_tools(tools)
    agent = (
        {"input": lambda x: x["input"],
         "agent_scratchpad": lambda x: format_to_openai_tool_messages(x["intermediate_steps"])},
        prompt,
        llm_with_tools,
        OpenAIToolsAgentOutputParser()
    )

    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    # 3. 에이전트 실행
    initial_goal = "Find and embed seminal papers on using conversational analysis for dementia screening."
    result = agent_executor.invoke({"input": initial_goal})

    print("\n\n===== Agent's Final Answer =====")
    print(result.get('output'))


if __name__ == "__main__":
    run_agent_pipeline()
