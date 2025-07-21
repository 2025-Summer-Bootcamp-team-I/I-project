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

// 점수에 따라 상태(danger, warning, good)를 반환하는 함수
const getResultStatus = (score: number) => {
  if (score < 40) return "danger";
  if (score < 70) return "warning";
  return "good";
};

// Lightbulb 아이콘 SVG 컴포넌트
const LightbulbIcon = ({ color }: { color: string }) => (
  <svg width="60" height="60" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M36 5C24.954 5 16 13.954 16 25C16 32.379 20.621 38.796 27 42.154V48C27 50.209 28.791 52 31 52H41C43.209 52 45 50.209 45 48V42.154C51.379 38.796 56 32.379 56 25C56 13.954 47.046 5 36 5Z" fill={color} fillOpacity="0.3"/>
    <path d="M36 5C24.954 5 16 13.954 16 25C16 32.379 20.621 38.796 27 42.154V48C27 50.209 28.791 52 31 52H41C43.209 52 45 50.209 45 48V42.154C51.379 38.796 56 32.379 56 25C56 13.954 47.046 5 36 5Z" stroke={color} strokeWidth="2"/>
    <path d="M31 58H41C42.1046 58 43 58.8954 43 60V61H29V60C29 58.8954 29.8954 58 31 58Z" fill="#4A5568"/>
    <rect x="32" y="52" width="8" height="6" fill="#4A5568"/>
  </svg>
);

// 각 검사 아이콘 컴포넌트
const TestIcon = ({ label, score }: { label: string, score: number }) => {
    const status = getResultStatus(score);
    const colorMap = {
        danger: '#F87171', // Red-400
        warning: '#FBBF24', // Amber-400
        good: '#6EE7B7', // Teal-300
    };
    const color = colorMap[status];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <LightbulbIcon color={color} />
            <span style={{ fontSize: '1.075rem', fontWeight: 500, color: '#D1D5DB' }}>{label}</span>
        </div>
    );
};

const MyPage = () => {
  const navigate = useNavigate();
  const reports = useReportHistoryStore((state) => state.reports);
  const addReport = useReportHistoryStore((state) => state.addReport);

  // 임시 테스트 데이터 추가
  useEffect(() => {
    if (reports.length === 0) {
      const testReports = [
        {
          report_id: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4일 전
          user_id: 1,
          drawingtest_result: "원을 잘 그렸습니다. 공간구성력이 양호합니다.",
          chat_result: "대화의 흐름 이해와 언어 표현이 매우 양호합니다.",
          ad8test_result: "모든 항목에 대해 변화가 없다고 답변하셨습니다.",
          final_result: "전반적인 인지 기능이 양호한 수준입니다.",
          total_score: 88, // 양호
          ad8_score: 15,
          drawing_score: 90,
          text_score: 88,
          memory_score: 95,
          Time_Space_score: 80,
          Judgment_score: 82,
          visual_score: 88,
          language_score: 93,
        },
        {
          report_id: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3일 전
          user_id: 1,
          drawingtest_result: "그림의 일부가 불완전합니다.",
          chat_result: "간헐적으로 대화의 흐름을 놓치는 경향이 있습니다.",
          ad8test_result: "몇몇 항목에서 변화가 감지되었습니다.",
          final_result: "경미한 인지 기능 저하가 의심됩니다.",
          total_score: 65, // 주의
          ad8_score: 45,
          drawing_score: 60,
          text_score: 68,
          memory_score: 70,
          Time_Space_score: 62,
          Judgment_score: 65,
          visual_score: 68,
          language_score: 60,
        },
        {
          report_id: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2일 전
          user_id: 1,
          drawingtest_result: "그림을 완성하지 못했습니다.",
          chat_result: "대화 이해에 어려움이 있습니다.",
          ad8test_result: "대부분의 항목에서 상당한 변화가 감지되었습니다.",
          final_result: "인지 기능 저하가 뚜렷하게 나타납니다.",
          total_score: 35, // 위험
          ad8_score: 20,
          drawing_score: 30,
          text_score: 38,
          memory_score: 25,
          Time_Space_score: 32,
          Judgment_score: 35,
          visual_score: 38,
          language_score: 20,
        },
        {
          report_id: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1일 전
          user_id: 1,
          drawingtest_result: "원을 잘 그렸습니다. 공간구성력이 양호합니다.",
          chat_result: "대화의 흐름 이해와 언어 표현이 매우 양호합니다.",
          ad8test_result: "모든 항목에 대해 변화가 없다고 답변하셨습니다.",
          final_result: "전반적인 인지 기능이 양호한 수준입니다.",
          total_score: 92, // 양호
          ad8_score: 10,
          drawing_score: 95,
          text_score: 90,
          memory_score: 98,
          Time_Space_score: 85,
          Judgment_score: 88,
          visual_score: 90,
          language_score: 95,
        },
        {
          report_id: Date.now(), // 오늘
          user_id: 1,
          drawingtest_result: "그림의 일부가 불완전합니다.",
          chat_result: "간헐적으로 대화의 흐름을 놓치는 경향이 있습니다.",
          ad8test_result: "몇몇 항목에서 변화가 감지되었습니다.",
          final_result: "경미한 인지 기능 저하가 의심됩니다.",
          total_score: 58, // 주의
          ad8_score: 50,
          drawing_score: 55,
          text_score: 62,
          memory_score: 60,
          Time_Space_score: 55,
          Judgment_score: 58,
          visual_score: 60,
          language_score: 55,
        },
      ];
      testReports.forEach(report => addReport(report));
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
        <svg fill="none" stroke="white" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </BackButton>
      <Content>
        <InnerContent>
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
              {reports.map((report, index) => {
                const status = getResultStatus(report.total_score);
                const statusText = {
                  danger: "위험",
                  warning: "주의",
                  good: "양호",
                };

                return (
                  <ReportCard key={index} status={status}>
                    <div>
                      <ReportDate>{getFormattedDate(report.report_id)}</ReportDate>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '1rem', color: '#D1D5DB', marginBottom: '0.25rem' }}>최종 결과</p>
                        <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', margin: 0, lineHeight: 1.2 }}>
                          {statusText[status]}
                        </h2>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1rem 0', borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <TestIcon label="AD-8 검사" score={report.ad8_score} />
                        <TestIcon label="대화 검사" score={report.text_score} />
                        <TestIcon label="그림 검사" score={report.drawing_score} />
                    </div>
                    
                    <ViewButton onClick={() => handleViewReport(report.report_id)}>
                      보고서 보기
                    </ViewButton>
                  </ReportCard>
                )
              })}
            </ReportList>
          )}
        </InnerContent>
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
  width: 100%; /* 화면 전체 너비 사용 */
  padding: 6rem 0 2rem 0; /* 수직 패딩만 유지, 수평 패딩 제거 */
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

const InnerContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem; /* InnerContent에 좌우 패딩 적용 */
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
  column-gap: 3rem; /* 좌우 간격 */
  row-gap: 2rem; /* 상하 간격 */
`;

const ReportCard = styled.div<{ status: string }>`
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(199, 210, 254, 0.2);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px -5px rgba(167, 139, 250, 0.1), 0 8px 10px -6px rgba(167, 139, 250, 0.1);
    border-color: rgba(199, 210, 254, 0.4);
  }

  h2 {
    color: ${({ status }) => (status === 'danger' ? '#F87171' : status === 'warning' ? '#FBBF24' : '#6EE7B7')};
  }
`;

const ReportDate = styled.p`
  color: #94A3B8;
  font-size: 1rem;
  margin-bottom: 1rem;
`;

const ViewButton = styled.button`
  width: 100%;
  background: transparent;
  border: 1px solid #A78BFA;
  color: #A78BFA;
  padding: 0.8rem;
  border-radius: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;

  &:hover {
    background: #A78BFA;
    color: white;
  }
`;

export default MyPage;
  