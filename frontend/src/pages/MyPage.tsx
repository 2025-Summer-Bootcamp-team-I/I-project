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

// 위험도에 따라 상태(danger, warning, good)를 반환하는 함수
const getRiskStatus = (risk?: string) => {
  if (!risk) return "unknown";
  const lowerRisk = risk.toLowerCase();
  if (lowerRisk.includes("높음") || lowerRisk.includes("위험") || lowerRisk.includes("고위험")) return "danger";
  if (lowerRisk.includes("중간") || lowerRisk.includes("경계") || lowerRisk.includes("보통")) return "warning";
  if (lowerRisk.includes("낮음") || lowerRisk.includes("양호") || lowerRisk.includes("양호")) return "good";
  return "unknown";
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
const TestIcon = ({ label, risk }: { label: string, risk?: string }) => {
    const status = getRiskStatus(risk);
    const colorMap = {
        danger: '#F87171', // Red-400
        warning: '#FBBF24', // Amber-400
        good: '#6EE7B7', // Teal-300
        unknown: '#94A3B8', // Gray-400
    };
    const color = colorMap[status];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <LightbulbIcon color={color} />
            <span style={{ fontSize: '1.075rem', fontWeight: 500, color: '#D1D5DB' }}>{label}</span>
            {risk && <span style={{ fontSize: '0.875rem', color: color, fontWeight: 500 }}>{risk}</span>}
        </div>
    );
};

const MyPage = () => {
  const navigate = useNavigate();
  const { myReports, isLoading, error, fetchMyReports } = useReportHistoryStore();

  // 컴포넌트 마운트 시 리포트 목록 가져오기
  useEffect(() => {
    fetchMyReports();
  }, [fetchMyReports]);

  // 날짜 문자열을 포맷팅하는 함수
  const getFormattedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewReport = (reportId: number) => {
    navigate(`/report/${reportId}`);
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <Container>
        <Background />
        <Header />
        <BackButton onClick={() => navigate(-1)} aria-label="뒤로가기">
          <svg fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </BackButton>
        <Content>
          <InnerContent>
            <Title>나의 검사 기록</Title>
            <LoadingState>
              <LoadingMessage>검사 기록을 불러오는 중...</LoadingMessage>
            </LoadingState>
          </InnerContent>
        </Content>
      </Container>
    );
  }

  // 에러가 있을 때
  if (error) {
    return (
      <Container>
        <Background />
        <Header />
        <BackButton onClick={() => navigate(-1)} aria-label="뒤로가기">
          <svg fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </BackButton>
        <Content>
          <InnerContent>
            <Title>나의 검사 기록</Title>
            <ErrorState>
              <ErrorMessage>{error}</ErrorMessage>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <RetryButton onClick={fetchMyReports}>다시 시도</RetryButton>
                {error.includes('로그인') && (
                  <LoginButton onClick={() => navigate('/login')}>로그인</LoginButton>
                )}
              </div>
            </ErrorState>
          </InnerContent>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <Background />
      <Header />
      <BackButton onClick={() => navigate(-1)} aria-label="뒤로가기">
        <svg fill="none" stroke="white" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </BackButton>
      <Content>
        <InnerContent>
          <Title>나의 검사 기록</Title>
          {myReports.length === 0 ? (
            <EmptyState>
              <EmptyMessage>아직 검사 기록이 없습니다.</EmptyMessage>
              <StartButton onClick={() => navigate('/main')}>
                검사 시작하기
              </StartButton>
            </EmptyState>
          ) : (
            <ReportList>
              {myReports.map((report) => {
                const finalStatus = getRiskStatus(report.final_risk);
                const statusText = {
                  danger: "위험",
                  warning: "경계",
                  good: "양호",
                  unknown: "미정",
                };

                return (
                  <ReportCard key={report.report_id} status={finalStatus}>
                    <div>
                      <ReportDate>{getFormattedDate(report.created_at)}</ReportDate>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '1rem', color: '#D1D5DB', marginBottom: '0.25rem' }}>최종 결과</p>
                        <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', margin: 0, lineHeight: 1.2 }}>
                          {statusText[finalStatus]}
                        </h2>
                        {report.final_risk && (
                          <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '0.5rem' }}>
                            {report.final_risk}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1rem 0', borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <TestIcon label="AD-8 검사" risk={report.ad8_risk} />
                        <TestIcon label="대화 검사" risk={report.chat_risk} />
                        <TestIcon label="그림 검사" risk={report.drawing_risk} />
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

const LoadingState = styled.div`
  text-align: center;
  padding: 4rem;
  background: rgba(30, 30, 45, 0.5);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
`;

const LoadingMessage = styled.p`
  color: #94A3B8;
  font-size: 1.2rem;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 4rem;
  background: rgba(30, 30, 45, 0.5);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
`;

const ErrorMessage = styled.p`
  color: #F87171;
  font-size: 1.2rem;
  margin-bottom: 2rem;
`;

const RetryButton = styled.button`
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

const LoginButton = styled.button`
  background: #4299E1;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #3182CE;
  }
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
    color: ${({ status }) => (status === 'danger' ? '#F87171' : status === 'warning' ? '#FBBF24' : status === 'good' ? '#6EE7B7' : '#94A3B8')};
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
  