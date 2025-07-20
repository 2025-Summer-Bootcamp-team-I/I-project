import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import Background from "../components/Background";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useReportIdStore } from "../store/reportIdStore";
import html2pdf from "html2pdf.js";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import highcharts3d from 'highcharts/highcharts-3d';
import { useReportStore } from "../store/reportStore";
import { useReportHistoryStore } from "../store/reportHistoryStore";

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLDivElement>(null);
  const resetReportId = useReportIdStore((state) => state.resetReportId);

  // zustand에서 report와 addReport 불러옴
  const report = useReportStore((state) => state.report);
  const addReport = useReportHistoryStore((state) => state.addReport);

  // 컴포넌트가 마운트될 때 report를 history에 추가
  useEffect(() => {
    if (report) {
      // report_id가 없으면 현재 timestamp를 id로 사용
      const reportWithId = {
        ...report,
        report_id: report.report_id || Date.now()
      };
      addReport(reportWithId);
    }
  }, [report, addReport]);

  if (!report) return <Container>로딩 중...</Container>;

  const chartOptions: Highcharts.Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      options3d: {
        enabled: true,
        alpha: 45,
        beta: 0,
        depth: 50,
        viewDistance: 25
      }
    },
    title: {
      text: '',
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    accessibility: {
      point: {
        valueSuffix: '%'
      }
    },
    plotOptions: {
      pie: {
        innerSize: '60%',
        allowPointSelect: true,
        cursor: 'pointer',
        depth: 35,
        dataLabels: {
          enabled: true,
          format: '{point.name}',
          style: {
            color: '#E2E8F0',
            fontSize: '16px',
            textOutline: 'none'
          }
        },
        showInLegend: true
      }
    },
    series: [{
      type: 'pie',
      name: '점유율',
      data: [
        { name: '기억력/판단력', y: (report.memory_score + report.Judgment_score) / 2, color: '#A78BFA', sliced: true },
        { name: '언어능력', y: (report.language_score + report.text_score) / 2, color: '#5EEAD4', sliced: true },
        { name: '시공간/시각능력', y: (report.Time_Space_score + report.visual_score) / 2, color: '#FBBF24', sliced: true },
      ]
    }],
    legend: {
      itemStyle: {
        color: '#E2E8F0',
        fontWeight: 'bold'
      },
      itemHoverStyle: {
        color: '#FFFFFF'
      },
      itemHiddenStyle: {
        color: '#666666'
      }
    },
    credits: {
      enabled: false
    }
  };

  const COLORS = ['#A78BFA', '#5EEAD4', '#FBBF24'];

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
      <Background isSurveyActive={true} />
      <Header />
      <TitleArea>
        <FixedTitle>최종 분석 리포트</FixedTitle>
      </TitleArea>
      <MainContent>
        <ScrollContent>
          <PdfTarget ref={pdfRef}>
            {/* 상단 종합 */}
            <TopSection>
              <PieChartWrapper>
                <HighchartsReact
                  highcharts={Highcharts}
                  options={chartOptions}
                />
              </PieChartWrapper>
            </TopSection>

            {/* 검사별 요약 */}
            <SectionTitle>검사별 요약</SectionTitle>
            {examResults.map((exam, idx) => (
              <ExamCard key={idx}>
                <ExamName
                  style={
                    ["설문 검사 (AD-8)", "대화 검사", "그림 검사"].includes(exam.name)
                      ? { color: "#5EEAD4" }
                      : undefined
                  }
                >
                  {exam.name}
                </ExamName>
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
        </ScrollContent>
        <BottomButtonBar>
          <ActionBtn onClick={() => {
            resetReportId();
            navigate("/main");
          }}>다시하기</ActionBtn>
          <ActionBtn $pdf onClick={handleDownloadPdf}>PDF로 저장</ActionBtn>
        </BottomButtonBar>
      </MainContent>
    </Container>
  );
};

export default ReportPage;

// --- 스타일은 위와 동일하게 붙여넣기 (생략 가능, 위 코드 참고)
const Container = styled.div`
  width: 100vw;
  height: 100vh;
  background: transparent;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const TitleArea = styled.div`
  position: fixed;
  top: 72px;  // Header 높이
  left: 0;
  right: 0;
  width: 100%;
  height: 5rem;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;

const FixedTitle = styled.h1`
    color: #FFFFFF;
    font-size: 2.5rem;
    text-align: center;
    font-weight: 600;
  `;

const MainContent = styled.div`
  position: fixed;
  top: 9rem;  // Header(72px) + TitleArea(5rem) 높이 합
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
`;


const ScrollContent = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding-bottom: 130px;
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
  max-width: 780px;  // 850px에서 780px로 감소
  margin: 0 auto;
  padding: 0 2rem;
`;

const TopSection = styled.div`
  margin: 3rem auto 4rem;
  display: flex;
  justify-content: center;
`;

const PieChartWrapper = styled.div`
  position: relative;
  width: 600px;
  height: 400px;
  svg:focus {
    outline: none;
  }
  svg {
    outline: none;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  color: #E2E8F0;
  margin-bottom: 2rem;
  max-width: 680px;
  margin-left: 1.5rem;   // auto → 1.5rem 정도로 변경
  margin-right: auto;    // 오른쪽은 auto로 놔두면 자연스럽게 살짝 왼쪽으로 이동
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(167, 139, 250, 0.1);
  text-align: left;      // 살짝 왼쪽 느낌이 더 강해짐
  padding-left: 0;       // 필요없으면 0, 약간 왼쪽 패딩 주고 싶으면 0.5rem
`;

const ExamCard = styled.div`
  background: rgba(30, 30, 45, 0.5);
  border: 1px solid rgba(167, 139, 250, 0.1);
  border-radius: 1rem;  // 1.2rem에서 1rem로 감소
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  padding: 1.8rem;  // 2rem에서 1.8rem으로 감소
  margin-bottom: 1.2rem;  // 1.5rem에서 1.2rem으로 감소
  backdrop-filter: blur(10px);
  max-width: 680px;  // 750px에서 680px로 감소
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
  background: transparent;
  padding: 2rem 0 1.5rem 0;
  z-index: 99;
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
