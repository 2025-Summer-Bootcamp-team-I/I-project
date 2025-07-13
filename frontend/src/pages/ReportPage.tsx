import React, { useRef } from "react";
import styled from "styled-components";
import Background from "../components/Background";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { useReportStore } from "../store/reportStore";

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLDivElement>(null);

  // zustand에서 report 불러옴
  const report = useReportStore((state) => state.report);

  if (!report) return <Container>로딩 중...</Container>;

  // DB 컬럼 순서대로 점수 표시
  const radarData = [
    { subject: "기억력", score: report.memory_score },
    { subject: "언어능력", score: report.language_score },
    { subject: "판단력", score: report.Judgment_score },
    { subject: "시공간", score: report.Time_Space_score },
    { subject: "시각", score: report.visual_score },
    { subject: "텍스트", score: report.text_score },
  ];

  // 각 검사별 요약
  const examResults = [
    {
      name: "설문 검사 (AD-8)",
      summary: report.ad8test_result,
      suggestion: "최근 기억력이나 판단력의 변화를 스스로 점검하는 것이 중요합니다. 변화가 감지된다면 주의를 기울이고 일상생활을 관찰해보세요.",
    },
    {
      name: "대화 검사",
      summary: `점수: ${report.text_score} / 100\n${report.chat_result}`,
      suggestion: "대화의 흐름을 이해하고 적절하게 반응하는 능력이 우수합니다. 꾸준히 대화하고 책을 읽는 습관을 가지면 더욱 좋습니다.",
    },
    {
      name: "그림 검사",
      summary: report.drawingtest_result,
      suggestion: "도형을 그리는 과정에서 어려움이 있었다면 주의력이나 시공간 능력 저하일 수 있습니다. 꾸준히 퍼즐이나 그리기 활동을 해보세요.",
      image: report.drawing_image,
    },
  ];

  const handleDownloadPdf = () => {
    if (pdfRef.current) {
      html2pdf()
        .set({
          margin: 0,
          filename: "기억건강_리포트.pdf",
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(pdfRef.current)
        .save();
    }
  };

  return (
    <Container>
      <Background />
      <Header />
      <ScrollArea>
        <PdfTarget ref={pdfRef}>
          {/* 상단 종합(레이더+카드) */}
          <TopGrid>
            <ChartCard>
              <ResponsiveContainer width="100%" height={340}>
                <RadarChart outerRadius={130} data={radarData}>
                  <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    stroke="#94A3B8" 
                    fontSize={14}
                    tickLine={false}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={false} 
                    axisLine={false}
                    stroke="rgba(148, 163, 184, 0.2)"
                  />
                  <Radar 
                    name="점수" 
                    dataKey="score" 
                    stroke="#A78BFA" 
                    fill="#A78BFA" 
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ScoreCard>
              <ScoreTitle>종합 평가</ScoreTitle>
              <ScoreLabel>종합 인지 점수</ScoreLabel>
              <ScoreValue>
                {report.total_score} <span>/100</span>
              </ScoreValue>
              <ScoreDesc>{report.final_result}</ScoreDesc>
            </ScoreCard>
          </TopGrid>

          {/* 검사별 요약 */}
          <SectionTitle>검사별 요약</SectionTitle>
          {examResults.map((exam, idx) => (
            <ExamCard key={idx}>
              <ExamName>{exam.name}</ExamName>
              <ExamContent>
                <ExamCol>
                  <Label>결과 요약</Label>
                  <Summary>
                    {exam.summary.split("\n").map((line, i) => (
                      <React.Fragment key={i}>
                        {line.includes("점수:") ? (
                          <ScoreHighlight>
                            {line.replace("점수:", "점수:")}
                          </ScoreHighlight>
                        ) : (
                          line
                        )}
                        <br />
                      </React.Fragment>
                    ))}
                    {exam.image && (
                      <ImageBox>
                        <ResultImg src={exam.image} alt="그림 검사 결과" />
                      </ImageBox>
                    )}
                  </Summary>
                </ExamCol>
                <ExamCol>
                  <Label>분석 및 제안</Label>
                  <Suggestion>{exam.suggestion}</Suggestion>
                </ExamCol>
              </ExamContent>
            </ExamCard>
          ))}
        </PdfTarget>
        <BottomSpacer />
      </ScrollArea>
      <BottomButtonBar>
        <ActionBtn onClick={() => navigate("/main")}>다시하기</ActionBtn>
        <ActionBtn $pdf onClick={handleDownloadPdf}>PDF로 저장</ActionBtn>
      </BottomButtonBar>
    </Container>
  );
};

export default ReportPage;

// --- 스타일은 위와 동일하게 붙여넣기 (생략 가능, 위 코드 참고)
const Container = styled.div`
  width: 100vw;
  min-height: 100vh;
  background: transparent;
  position: relative;
  overflow: hidden;
`;
const ScrollArea = styled.div`
  position: absolute;
  top: 72px; left: 0; right: 0; bottom: 0;
  width: 100vw;
  overflow-y: auto;
  padding-bottom: 130px;
  z-index: 2;
  &::-webkit-scrollbar { width: 12px; background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #a78bfa 0%, #6366f1 100%);
    border-radius: 12px;
    min-height: 44px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  &::-webkit-scrollbar-track { background: transparent; border-radius: 12px; }
  scrollbar-color: #a78bfa #191628;
  scrollbar-width: thin;
`;
const PdfTarget = styled.div`
  max-width: 1200px;
  margin: 2.5rem auto 0;
  padding: 0 2rem;
`;
const TopGrid = styled.div`
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 2rem;
  margin: 1rem auto 3rem;
  max-width: 1000px;
  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: center;
    gap: 1.7rem;
    margin: 0.5rem auto 2rem;
  }
`;
const ChartCard = styled.div`
  background: rgba(30, 30, 45, 0.5);
  border: 1px solid rgba(167, 139, 250, 0.1);
  border-radius: 1.8rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  padding: 2rem;
  min-width: 460px;
  max-width: 520px;
  backdrop-filter: blur(10px);
  @media (max-width: 1024px) {
    width: 95vw;
    min-width: 0;
    padding: 1.5rem 1rem;
  }
`;
const ScoreCard = styled.div`
  background: rgba(30, 30, 45, 0.5);
  border: 1px solid rgba(167, 139, 250, 0.1);
  border-radius: 1.8rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  padding: 3rem;
  min-width: 460px;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  backdrop-filter: blur(10px);
  @media (max-width: 1024px) {
    width: 95vw;
    min-width: 0;
    padding: 2rem;
  }
`;
const ScoreTitle = styled.div`
  color: #E2E8F0;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;
const ScoreLabel = styled.div`
  color: #94A3B8;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;
const ScoreValue = styled.div`
  font-size: 4rem;
  font-weight: 700;
  color: #A78BFA;
  letter-spacing: -1px;
  margin-bottom: 1rem;
  span {
    font-size: 1.5rem;
    color: #94A3B8;
    margin-left: 0.5rem;
    font-weight: 500;
  }
`;
const ScoreDesc = styled.p`
  font-size: 1.1rem;
  color: #CBD5E1;
  line-height: 1.6;
  margin: 0;
`;
const SectionTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  color: #E2E8F0;
  margin-bottom: 2rem;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(167, 139, 250, 0.1);
`;
const ExamCard = styled.div`
  background: rgba(30, 30, 45, 0.5);
  border: 1px solid rgba(167, 139, 250, 0.1);
  border-radius: 1.4rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  padding: 2.5rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
`;
const ExamName = styled.div`
  font-size: 1.4rem;
  font-weight: 600;
  color: #E2E8F0;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(167, 139, 250, 0.1);
`;
const ExamContent = styled.div`
  display: flex;
  gap: 3rem;
  @media (max-width: 900px) {
    flex-direction: column;
    gap: 2rem;
  }
`;
const ExamCol = styled.div`
  flex: 1;
  min-width: 230px;
  background: rgba(20, 20, 35, 0.3);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(167, 139, 250, 0.05);
`;
const Label = styled.div`
  color: #94A3B8;
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(167, 139, 250, 0.1);
`;
const Summary = styled.div`
  color: #CBD5E1;
  font-size: 1.1rem;
  line-height: 1.7;
  white-space: pre-line;
`;
const ScoreHighlight = styled.span`
  color: #A78BFA;
  font-weight: 600;
  font-size: 1.15rem;
  background: rgba(167, 139, 250, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 0.3rem;
`;
const ImageBox = styled.div`
  margin-top: 1.1rem;
  text-align: center;
`;
const ResultImg = styled.img`
  width: 160px;
  height: 160px;
  object-fit: contain;
  border-radius: 18px;
  background: #23263b;
  box-shadow: 0 2px 16px #a78bfa22;
  border: 1.5px solid #2d3154;
  display: inline-block;
`;
const Suggestion = styled.div`
  color: #CBD5E1;
  font-size: 1.1rem;
  line-height: 1.6;
`;
const BottomButtonBar = styled.div`
  position: fixed;
  left: 0; right: 0; bottom: 0;
  width: 100vw;
  display: flex;
  justify-content: center;
  gap: 1.3rem;
  background: linear-gradient(180deg, rgba(20, 20, 35, 0) 0%, rgba(20, 20, 35, 0.95) 50%);
  padding: 2rem 0 1.5rem 0;
  z-index: 99;
  backdrop-filter: blur(20px);
`;
const ActionBtn = styled.button<{ $pdf?: boolean }>`
  background: ${({ $pdf }) => ($pdf ? "#7C3AED" : "rgba(124, 58, 237, 0.1)")};
  color: ${({ $pdf }) => ($pdf ? "#FFFFFF" : "#A78BFA")};
  font-weight: 600;
  border-radius: 1rem;
  border: 1px solid ${({ $pdf }) => ($pdf ? "#7C3AED" : "rgba(167, 139, 250, 0.2)")};
  font-size: 1.1rem;
  padding: 0.8rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: ${({ $pdf }) => ($pdf ? "#6D28D9" : "rgba(124, 58, 237, 0.15)")};
    border-color: ${({ $pdf }) => ($pdf ? "#6D28D9" : "rgba(167, 139, 250, 0.3)")};
  }
`;
const BottomSpacer = styled.div`
  height: 130px;
`;