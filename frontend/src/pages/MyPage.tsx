import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Background from "../components/Background";
import Header from "../components/Header";
import { useReportHistoryStore } from "../store/reportHistoryStore";
import { useEffect } from "react";

// ChattingSelectPage에서 사용한 BackButton 스타일 복사
const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: fixed;
  top: 5rem;
  left: 2rem;
  z-index: 30;
  border-radius: 9999px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  @media (max-width: 768px) {
    top: 4rem;
    left: 1rem;
    padding: 0.4rem;
    svg {
      width: 1.2rem;
      height: 1.2rem;
    }
  }
`;

const MyPage = () => {
  const navigate = useNavigate();
  const reports = useReportHistoryStore((state) => state.reports);
  const addReport = useReportHistoryStore((state) => state.addReport);

  // 임시 테스트 데이터 추가
  useEffect(() => {
    if (reports.length === 0) {
      const testReport = {
        report_id: Date.now(),
        user_id: 1,
        drawingtest_result: "원을 잘 그렸습니다. 공간구성력이 양호합니다.",
        chat_result: "대화의 흐름 이해와 언어 표현이 매우 양호합니다.",
        ad8test_result: "모든 항목에 대해 변화가 없다고 답변하셨습니다.",
        final_result: "전반적인 인지 기능이 양호한 수준입니다.",
        total_score: 88,
        ad8_score: 15,
        drawing_score: 90,
        text_score: 88,
        memory_score: 95,
        Time_Space_score: 80,
        Judgment_score: 82,
        visual_score: 88,
        language_score: 93,
      };
      addReport(testReport);
    }
  }, [reports.length, addReport]);

  // timestamp를 날짜 문자열로 변환
  const getFormattedDate = (timestamp: number | undefined) => {
    if (!timestamp) return "날짜 없음";
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewReport = (reportId: number | undefined) => {
    if (!reportId) return;
    navigate(`/report/${reportId}`);
  };

  return (
    <Container>
      <Background />
      <Header />
      {/* 좌측 상단에 뒤로가기 버튼 추가 */}
      <BackButton onClick={() => navigate(-1)} aria-label="뒤로가기">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </BackButton>
      <Content>
        <Title>나의 검사 기록</Title>
        {reports.length === 0 ? (
          <EmptyState>
            <EmptyMessage>아직 검사 기록이 없습니다.</EmptyMessage>
            <StartButton onClick={() => navigate('/main')}>
              검사 시작하기
            </StartButton>
          </EmptyState>
        ) : (
          <ReportList>
            {reports.map((report, index) => (
              <ReportCard key={index}>
                <ReportDate>{getFormattedDate(report.report_id)}</ReportDate>
                <ScoreSection>
                  <ScoreLabel>종합 점수</ScoreLabel>
                  <ScoreValue>{report.total_score}<span>/100</span></ScoreValue>
                </ScoreSection>
                <DetailSection>
                  <DetailItem>
                    <DetailLabel>기억력</DetailLabel>
                    <DetailScore>{report.memory_score}</DetailScore>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>언어능력</DetailLabel>
                    <DetailScore>{report.language_score}</DetailScore>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>판단력</DetailLabel>
                    <DetailScore>{report.Judgment_score}</DetailScore>
                  </DetailItem>
                </DetailSection>
                <ViewButton onClick={() => handleViewReport(report.report_id)}>
                  보고서 보기
                </ViewButton>
              </ReportCard>
            ))}
          </ReportList>
        )}
      </Content>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 6rem 2rem 2rem;
  position: relative;
  z-index: 1;
  height: calc(100vh - 6rem); // 상단 패딩을 제외한 높이
  overflow-y: auto;
  
  // 스크롤바 스타일링
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(30, 30, 45, 0.5);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #A78BFA;
    border-radius: 4px;
    
    &:hover {
      background: #9061F9;
    }
  }

  // Firefox 스크롤바 스타일링
  scrollbar-width: thin;
  scrollbar-color: #A78BFA rgba(30, 30, 45, 0.5);
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #E2E8F0;
  margin-bottom: 2rem;
  text-align: center;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem;
  background: rgba(30, 30, 45, 0.5);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
`;

const EmptyMessage = styled.p`
  color: #94A3B8;
  font-size: 1.2rem;
  margin-bottom: 2rem;
`;

const StartButton = styled.button`
  background: #A78BFA;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #9061F9;
  }
`;

const ReportList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

const ReportCard = styled.div`
  background: rgba(30, 30, 45, 0.5);
  border: 1px solid rgba(167, 139, 250, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
`;

const ReportDate = styled.div`
  color: #94A3B8;
  font-size: 1rem;
  margin-bottom: 1rem;
`;

const ScoreSection = styled.div`
  margin-bottom: 1.5rem;
`;

const ScoreLabel = styled.div`
  color: #94A3B8;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const ScoreValue = styled.div`
  color: #A78BFA;
  font-size: 2rem;
  font-weight: bold;

  span {
    font-size: 1rem;
    color: #94A3B8;
    margin-left: 0.3rem;
  }
`;

const DetailSection = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const DetailItem = styled.div`
  text-align: center;
`;

const DetailLabel = styled.div`
  color: #5EEAD4 !important; // important를 추가하여 확실히 적용되도록 함
  font-size: 0.8rem;
  margin-bottom: 0.3rem;
  font-weight: 600;
`;

const DetailScore = styled.div`
  color: #E2E8F0;
  font-size: 1.1rem;
  font-weight: 500;
`;

const ViewButton = styled.button`
  width: 100%;
  background: transparent;
  border: 1px solid #A78BFA;
  color: #A78BFA;
  padding: 0.8rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #A78BFA;
    color: white;
  }
`;

export default MyPage;
  