import React, { useRef, useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import Background from "../components/Background";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { useReportIdStore } from "../store/reportIdStore";
import html2pdf from "html2pdf.js";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'highcharts/highcharts-3d';
import { useReportStore } from "../store/reportStore";
import { useReportHistoryStore } from "../store/reportHistoryStore";
import { getReportResult, getChatLogs, finalizeReport } from "../api"; // finalizeReport 추가
import lightbulbIcon from '../assets/imgs/lightbulb.png'; // 경계, 기본
import lightbulbBlueIcon from '../assets/imgs/lightbulb-blue.png'; // 양호
import lightbulbRedIcon from '../assets/imgs/lightbulb-red.png'; // 주의
import type { ChatLogResponse } from "../types/api";

import LoadingPage from "./LoadingPage"; // LoadingPage 임포트

declare module 'highcharts' {
  interface PointOptionsObject {
    status?: '양호' | '경계' | '위험';
  }
}

// Custom Hook to get window size
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const HighchartsGlobalStyle = createGlobalStyle`
  /* Highcharts 백그라운드 */
  .highcharts-background {
    fill: transparent;
  }

  /* 데이터 레이블 커스텀 스타일 */
  .custom-datalabel {
    width: 290px;
    white-space: normal;
    
    @media (max-width: 900px) {
      width: 200px;
    }

    @media (max-width: 500px) {
      width: 150px;
    }

    &.dialog-label {
      text-align: right;
    }

    &.drawing-label {
      text-align: left;

      @media (max-width: 500px) {
        left: 10px;
      }
    }
    
    b {
      font-size: 17px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .status {
        font-size: 13px;
        flex-shrink: 0;
        padding-left: 8px;
      }
    }

    &.drawing-label b { }
    &.dialog-label b { }
    &.survey-label b { }

    .status-danger { color: #EF4444; }
    .status-warning { color: #FBBF24; }
    .status-safe { color: #22C55E; }

    .description {
      color: #E2E8F0;
      font-size: 13px;
    }
  }

  /* 데이터 레이블 기본 스타일 */
  .highcharts-data-label text {
    /* text-outline: none !important; */
  }
  
  /* 범례(Legend) 스타일 */
  .highcharts-legend-item text {
    color: #E2E8F0 !important;
    font-weight: bold !important;
  }

  .highcharts-legend-item:hover text {
    color: #FFFFFF !important;
  }
`;

// -- Components --

// 카드 컴포넌트 분리
interface ExamCardProps {
  exam: { name: string; summary: string; suggestion: string; image?: string; };
  status: '양호' | '경계' | '위험';
  chatLogs?: ChatLogResponse[]; // chatLogs를 props로 추가
}

const AD8Card: React.FC<ExamCardProps & { ad8Score: number; maxAD8Score: number; offset: number; }> = ({ exam, status, ad8Score, maxAD8Score, offset }) => (
  <ExamCard $cardType="ad8">
    <StatusBadge status={status}>{status}</StatusBadge>
    <ExamName $isHighlighted>{exam.name}</ExamName>
    <ExamContent>
      <ExamCol>
        <Label>결과 요약</Label>
        <AD8ResultContainer>
          <AD8ProgressContainer>
            <StyledSVG viewBox="0 0 140 140">
              <ProgressBackground />
              <ProgressCircle $offset={offset} />
            </StyledSVG>
            <AD8ScoreText>{ad8Score}<span> / {maxAD8Score}</span></AD8ScoreText>
          </AD8ProgressContainer>
        </AD8ResultContainer>
      </ExamCol>
      <ExamCol>
        <Label>분석 및 제안</Label>
        <Suggestion>{exam.suggestion}</Suggestion>
      </ExamCol>
    </ExamContent>
  </ExamCard>
);

const ChatCard: React.FC<ExamCardProps> = ({ exam, status, chatLogs }) => {
  const chatLines = (chatLogs || [])
    .filter(item => item.role === 'user' || item.role === 'ai')
    .map(item => {
      const prefix = item.role === 'user' ? '사용자:' : 'AI:';
      return `${prefix} ${item.message}`;
    });

  return (
    <ExamCard>
      <StatusBadge status={status}>{status}</StatusBadge>
      <ExamName $isHighlighted>{exam.name}</ExamName>
      <ExamContent>
        <ExamCol>
          <Label>대화 내용</Label>
          <ChatWindow>
            {chatLines.length > 0 ? (
              chatLines.map((line, i) => {
                const isUser = line.startsWith("사용자:");
                const message = line.substring(line.indexOf(":") + 1).trim();

                if (!message) return null;

                return (
                  <MessageBubble key={i} $isUser={isUser}>
                    {message}
                  </MessageBubble>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', color: '#94A3B8', alignSelf: 'center' }}>대화 기록이 없습니다.</div>
            )}
          </ChatWindow>
        </ExamCol>
        <ExamCol>
          <Label>분석 및 제안</Label>
          <Suggestion>{exam.suggestion}</Suggestion>
        </ExamCol>
      </ExamContent>
    </ExamCard>
  );
};

const DrawingCard: React.FC<ExamCardProps> = ({ exam, status }) => (
  <ExamCard>
    <StatusBadge status={status}>{status}</StatusBadge>
    <ExamName $isHighlighted>{exam.name}</ExamName>
    <ExamContent>
      <ExamCol>
        <ImageBox>
          <ResultImg src={exam.image} alt="그림 검사 결과" />
        </ImageBox>
      </ExamCol>
      <ExamCol>
        <Label>분석 및 제안</Label>
        <Suggestion>{exam.suggestion}</Suggestion>
      </ExamCol>
    </ExamContent>
  </ExamCard>
);



const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { reportId: reportIdFromUrl } = useParams<{ reportId: string }>(); // URL에서 ID 추출
  const reportIdFromStore = useReportIdStore((state) => state.reportId);
  const chatIdFromStore = useReportIdStore((state) => state.chatId);
  const reportId = Number(reportIdFromUrl) || reportIdFromStore;
  const pdfRef = useRef<HTMLDivElement>(null);
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  
  const { report, setReport } = useReportStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width: windowWidth } = useWindowSize();
  const addReport = useReportHistoryStore((state) => state.addReport);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState(0);
  const [chatLogs, setChatLogs] = useState<ChatLogResponse[] | null>(null);


  useEffect(() => {
    // ID가 URL과 스토어 어디에도 없으면 에러 처리
    if (!reportId) {
      setError("리포트 ID가 없습니다. 메인 페이지로 이동합니다.");
      setTimeout(() => navigate('/main'), 3000);
      setIsLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        setIsLoading(true);
        // 1. finalize API 먼저 호출
        await finalizeReport(reportId);
        // 2. 최신 리포트 데이터 받아오기
        const reportData = await getReportResult(reportId);
        setReport(reportData);
        console.log("ReportPage: report.drawing_image_url =", reportData.drawing_image_url);

        // 3. chatLogs도 불러오기 (reportId 사용)
        const chatLogsData = await getChatLogs(reportId);
        
        setChatLogs(chatLogsData || []);
      } catch (err) {
        setError("리포트를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [reportId, setReport, navigate, chatIdFromStore]);

  // 히스토리 추가 useEffect
  useEffect(() => {
    if (report) {
      const reportWithId = {
        ...report,
        report_id: report.report_id || reportId
      };
      // 히스토리에 이미 같은 ID의 리포트가 있는지 확인 후 추가
      // (이 부분은 reportHistoryStore의 로직에 따라 달라질 수 있음)
      addReport(reportWithId);
    }
  }, [report, reportId, addReport]);

  const [selectedLightbulbIcon, setSelectedLightbulbIcon] = useState(lightbulbIcon);

  useEffect(() => {
    if (report) {
      // ⭐️ 콘솔 로그 추가: report.final_risk 값을 확인합니다.
      

      const finalRisk = report.final_risk || '경계';
      
      if (finalRisk === '양호') {
        setSelectedLightbulbIcon(lightbulbBlueIcon);
      } else if (finalRisk === '위험') {
        setSelectedLightbulbIcon(lightbulbRedIcon);
      } else {
        setSelectedLightbulbIcon(lightbulbIcon);
      }
    }
  }, [report]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgDimensions({ width: img.width, height: img.height });
    };
    img.src = selectedLightbulbIcon;
  }, [selectedLightbulbIcon]);

  useEffect(() => {
    if (report) {
      const maxAD8Score = 8;
      const radius = 62;
      const circumference = 2 * Math.PI * radius;
      const progressOffset = circumference - (report.ad8_score / maxAD8Score) * circumference;
      const timer = setTimeout(() => setOffset(progressOffset), 100);
      return () => clearTimeout(timer);
    }
  }, [report]);

  useEffect(() => {
    if (chartComponentRef.current && chartComponentRef.current.chart) {
      chartComponentRef.current.chart.reflow();
    }
  }, [windowWidth]);


  // --- Early returns ---
  if (isLoading) return <LoadingPage />;
  if (error) return <Container>{error}</Container>;
  if (!report) return <Container>표시할 리포트 데이터가 없습니다.</Container>;

  // --- 렌더링에 필요한 변수 선언 ---
  const drawingStatus = (report.drawing_risk || '경계') as '양호' | '경계' | '위험';
  const dialogStatus = (report.chat_risk || '경계') as '양호' | '경계' | '위험';
  const surveyStatus = (report.ad8_risk || '경계') as '양호' | '경계' | '위험';
  const ad8Score = report.ad8_score;
  const maxAD8Score = 8;

  // final_risk를 명확히 받아와서 사용 (없으면 '경계' 기본값)
  const finalRisk = (report.final_risk || '경계') as '양호' | '경계' | '위험';

  const getStatusColor = (status: '양호' | '경계' | '위험') => {
    if (status === '양호') return '#18A092';
    if (status === '경계') return '#F7D46E';
    return '#EE0000';
  };

  // final_risk를 사용하는 부분에 finalRisk로 대체
  const finalRiskText = finalRisk; // 종합 인지 결과 등에서 사용

  const chartOptions: Highcharts.Options = {
    chart: {
      type: 'pie',
      options3d: {
        enabled: true,
        alpha: 55,
        beta: 0,
        depth: 50,
        viewDistance: 25
      },
      events: {
        render: function (this: Highcharts.Chart) {
          if (!this.renderer || imgDimensions.width === 0 || imgDimensions.height === 0) {
            return;
          }

          const { renderer } = this;
          const maxSize = 200;
          const { width: originalWidth, height: originalHeight } = imgDimensions;

          let newWidth, newHeight;
          if (originalWidth > originalHeight) {
            newWidth = maxSize;
            newHeight = (maxSize * originalHeight) / originalWidth;
          } else {
            newHeight = maxSize;
            newWidth = (maxSize * originalWidth) / originalHeight;
          }

          const centerX = this.plotLeft + this.plotWidth * 0.5;
          const centerY = this.plotTop + this.plotHeight * 0.5;
          const yOffset = 80;
          const imageX = centerX - newWidth / 2;
          const imageY = centerY - newHeight / 2 - yOffset;

          // Image
          if (!(this as any).customImage) {
            (this as any).customImage = renderer.image(selectedLightbulbIcon, imageX, imageY, newWidth, newHeight)
              .attr({ opacity: 0 })
              .add()
              .animate({ opacity: 1 }, { duration: 800 });
          }
          (this as any).customImage.attr({ x: imageX, y: imageY, width: newWidth, height: newHeight });

          // Text
          const mainTextContent = '종합 인지 결과';
          const riskTextContent = `${finalRiskText}`;
          const riskColor = getStatusColor(finalRiskText);
          const textY = centerY - yOffset - 30;
          const baseX = centerX + newWidth / 2 + 15;

          const mainTextStyle = { color: '#E2E8F0', fontSize: '25px', fontWeight: '600' };
          const riskTextStyle = { color: riskColor, fontSize: '25px', fontWeight: '600' };

          // Main Text
          if (!(this as any).customMainText) {
            (this as any).customMainText = renderer.text(mainTextContent, baseX, textY)
              .css(mainTextStyle)
              .attr({ align: 'left', opacity: 0 })
              .add()
              .animate({ opacity: 1 }, { duration: 800 });
          }
          (this as any).customMainText.attr({ x: baseX, y: textY }).css(mainTextStyle);

          const mainTextWidth = (this as any).customMainText.getBBox().width;
          // --- 1. 원(Circle) 위치 계산 및 렌더링 ---
          const circleX = baseX + mainTextWidth + 30; // 원의 중심 x좌표 (간격 조절)
          const circleY = textY - 10; // 텍스트와 세로 중앙 정렬

          // Risk Circle 렌더링
          if (!(this as any).customRiskCircle) {
            (this as any).customRiskCircle = renderer.circle(circleX, circleY, 8)
              .attr({ fill: riskColor, opacity: 0 })
              .add()
              .animate({ opacity: 1 }, { duration: 800 });
          }
          (this as any).customRiskCircle.attr({ cx: circleX, cy: circleY, fill: riskColor });


          // --- 2. 텍스트(Risk Text) 위치 계산 및 렌더링 ---
          const circleRadius = 6;
          const riskTextX = circleX + circleRadius + 5; // 원 바로 오른쪽에 오도록 x좌표 계산

          // Risk Text 렌더링
          if (!(this as any).customRiskText) {
            (this as any).customRiskText = renderer.text(riskTextContent, riskTextX, textY)
              .css(riskTextStyle)
              .attr({ align: 'left', opacity: 0 })
              .add()
              .animate({ opacity: 1 }, { duration: 800 });
          }
          (this as any).customRiskText.attr({ text: riskTextContent, x: riskTextX, y: textY }).css(riskTextStyle);


          // --- 3. z-index 순서 조정 (Bring to front) ---
          // (이미지, 메인 텍스트, 원, 위험도 텍스트 순으로 앞에 보이게 함)
          (this as any).customImage.toFront();
          (this as any).customMainText.toFront();
          (this as any).customRiskCircle.toFront();
          (this as any).customRiskText.toFront();

        }
      }
    },
    title: {
      text: '',
    },
    tooltip: {
      enabled: false
    },
    accessibility: {
      point: {
        valueSuffix: '%'
      }
    },
    plotOptions: {
      pie: {
        animation: false,
        innerSize: '50%',
        allowPointSelect: false,
        depth: 20,
        startAngle: 45,
        size: windowWidth > 900 ? '75%' : '100%',
        events: {
          afterAnimate: function (this: Highcharts.Series) {
            this.points.forEach(point => {
              if (point.graphic) {
                point.graphic.attr({
                  opacity: 0
                }).animate({
                  opacity: 1
                }, {
                  duration: 800
                });
              }
            });
          }
        },
        dataLabels: {
          enabled: true,
          crop: false,
          overflow: 'allow',
          formatter: function (this: Highcharts.Point) {
            const pointOptions = this.options as { status?: '양호' | '경계' | '위험' };
            let statusText = pointOptions.status || '위험';
            let statusClass = '';
            let statusColor = '';
            let description = '';

            switch (statusText) {
              case '위험':
                statusClass = 'status-danger';
                statusColor = '#EF4444';
                description = '기능 저하가 뚜렷하게 나타나고 있습니다. 전문가와의 상담을 권장합니다.';
                break;
              case '경계':
                statusClass = 'status-warning';
                statusColor = '#FBBF24';
                description = '약간의 기능 저하가 관찰되나, 일상에 큰 영향은 없습니다. 꾸준한 관리가 필요합니다.';
                break;
              case '양호':
                statusClass = 'status-safe';
                statusColor = '#22C55E';
                description = '해당 영역의 인지 기능이 안정적으로 유지되고 있습니다.';
                break;
            }

            const nameColor = getStatusColor(statusText);
            const isDialog = this.name === '대화 검사';
            const isDrawing = this.name === '그림 검사';

            let labelClass = 'custom-datalabel';
            if (isDialog) {
              labelClass += ' dialog-label';
            } else if (isDrawing) {
              labelClass += ' drawing-label';
            } else {
              labelClass += ' survey-label';
            }

            return `<div class="${labelClass}">
                        <b style="color: ${nameColor}">
                          <span>${this.name}</span>
                          <span class="status ${statusClass}" style="font-size: 20px;">
                            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${statusColor}; margin-right: 5px; vertical-align: middle;"></span><span style="vertical-align: middle; ">${statusText}</span>
                          </span>
                        </b>
                        <span class="description" style="font-size: 15px;">${description}</span>
                    </div>`;
          },
          useHTML: true,
          style: {
            fontSize: '13px',
            textOutline: 'none'
          },
          distance: windowWidth > 900 ? 40 : 15,
        },
        showInLegend: true
      }
    },
    series: [{
      type: 'pie',
      name: '점유율',
      data: [
        { name: '그림 검사', y: 33, color: getStatusColor(drawingStatus), sliced: true, status: drawingStatus },
        { name: '대화 검사', y: 33, color: getStatusColor(dialogStatus), sliced: true, status: dialogStatus },
        { name: '설문 검사 (AD-8)', y: 34, color: getStatusColor(surveyStatus), sliced: true, status: surveyStatus },
      ]
    }],
    legend: { enabled: false },
    credits: { enabled: false }
  };


  interface ExamResult {
    name: string;
    summary: string;
    suggestion: string;
    image?: string;
    status: '양호' | '경계' | '위험';
    chat_logs?: ChatLogResponse[];
  }

  const examResults: ExamResult[] = [
    {
      name: "설문 검사 (AD-8)",
      summary: `${report.ad8_score}/8`,
      suggestion: report.ad8test_result,
      status: surveyStatus as '양호' | '경계' | '위험',
    },
    {
      name: "대화 검사",
      summary: report.chat_result,
      suggestion: report.chat_result, // 분석 결과
      status: dialogStatus as '양호' | '경계' | '위험',
      chat_logs: chatLogs ?? [], // chatLogs를 명확히 할당
    },
    {
      name: "그림 검사",
      summary: report.drawingtest_result,
      suggestion: report.drawingtest_result,
      image: report.drawing_image_url || undefined,
      status: drawingStatus as '양호' | '경계' | '위험',
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
      <HighchartsGlobalStyle />
      <Background isSurveyActive={true} />
      <Header />
      <MainContent>
        <ScrollContent>
          <TitleArea>
            <FixedTitle>최종 분석 리포트</FixedTitle>
          </TitleArea>
          <PdfTarget ref={pdfRef}>
            {/* 상단 종합 */}
            <TopSection>
              <PieChartWrapper>
                <HighchartsReact
                  highcharts={Highcharts}
                  options={chartOptions}
                  ref={chartComponentRef}
                />
              </PieChartWrapper>
            </TopSection>

            {/* 종합 인지 기능 평가 결과 */}
            <OverallSummaryCard>
              <SummaryCardTitle>종합 인지 기능 평가 결과</SummaryCardTitle>
              <SummaryText>{report.final_result ? report.final_result : '종합 인지 결과가 없습니다.'}</SummaryText>
            </OverallSummaryCard>

            {/* 검사별 요약 */}
            <SectionTitle>검사별 결과 및 해석</SectionTitle>
            {examResults.map((exam, idx) => {
              if (exam.name === "설문 검사 (AD-8)") {
                return <AD8Card key={idx} exam={exam} status={exam.status} ad8Score={ad8Score} maxAD8Score={maxAD8Score} offset={offset} />;
              }
              if (exam.name === "대화 검사") {
                // chat_logs를 명확히 넘김
                return <ChatCard key={idx} exam={exam} status={exam.status} chatLogs={exam.chat_logs} />;
              }
              if (exam.name === "그림 검사") {
                return <DrawingCard key={idx} exam={exam} status={exam.status} />;
              }
              return null;
            })}
          </PdfTarget>
          <BottomSpacer />
        </ScrollContent>
        <BottomButtonBar>
          <ActionBtn onClick={() => {
            navigate("/main", { state: { cardIndex: 0, needsReset: true } });
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
  width: 100%;
  height: 5rem;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FixedTitle = styled.h1`
    color: #C4B5FD;
    font-size: 2.5rem;
    text-align: center;
    font-weight: 600;

    @media (max-width: 768px) {
      font-size: 2rem;
    }
  `;

const MainContent = styled.div`
  position: fixed;
  top: 72px;  // Header 높이
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
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const TopSection = styled.div`
  margin: 3rem auto 4rem;
  display: flex;
  justify-content: center;
`;

const PieChartWrapper = styled.div`
  position: relative;
  width: 1100px;
  max-width: 100%;
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
  color: #C4B5FD;
  margin-bottom: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(167, 139, 250, 0.1);
  text-align: left;
  padding-left: 0;
`;

const OverallSummaryCard = styled.div`
  background: rgba(30, 30, 45, 0);
  border: 1px solid rgba(167, 139, 250, 0.1);
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  padding: 2rem;
  margin-bottom: 3rem;
  margin-top: -4rem;
  padding-top: 1rem;
  backdrop-filter: blur(10px);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 900px) {
    max-width: 100%;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
`;

const SummaryCardTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 600;
  color: #E2E8F0;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(167, 139, 250, 0.1);
  text-align: center;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const SummaryText = styled.p`
  color: #CBD5E1;
  font-size: 1.1rem;
  line-height: 1.8;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ExamCard = styled.div<{ $cardType?: string }>`
  background: rgba(30, 30, 45, 0.5);
  border: 1px solid rgba(167, 139, 250, 0.1);
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  padding: 1.8rem;
  padding-left: 1rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  
  ${({ $cardType }) => $cardType === 'ad8' && `
    margin-top: -1rem;
  `}

  @media (max-width: 900px) {
    max-width: 100%;
    padding: 1.5rem;
  }
`;

const AD8ResultContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
`;

const AD8ProgressContainer = styled.div`
  position: relative;
  width: 140px;
  height: 140px;
`;

const StyledSVG = styled.svg`
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
`;

const ProgressCircleBase = styled.circle.attrs({
  cx: 70,
  cy: 70,
  r: 62,
})`
  fill: transparent;
  stroke-width: 12px;
`;

const ProgressBackground = styled(ProgressCircleBase)`
  stroke: rgba(255, 255, 255, 0.1);
`;

const ProgressCircle = styled(ProgressCircleBase) <{ $offset: number }>`
  stroke: #A78BFA;
  stroke-dasharray: ${2 * Math.PI * 62};
  stroke-dashoffset: ${({ $offset }) => $offset};
  transition: stroke-dashoffset 0.8s ease-out;
  stroke-linecap: round;
`;

const AD8ScoreText = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #FFFFFF;
    font-size: 1.8rem;
    font-weight: 600;

    span {
        font-size: 1rem;
        color: #94A3B8;
    }
`;


const StatusBadge = styled.div<{ status: '양호' | '경계' | '위험' }>`
  position: absolute;
  top: 1.3rem;
  right: 1.8rem;
  font-size: 1.3rem;
  font-weight: 700;
  margin-top: -0.5rem;
  color: ${({ status }) => {
    if (status === '양호') return '#22C55E';
    if (status === '경계') return '#FBBF24';
    return '#EF4444';
  }};
`;

const ExamName = styled.div<{ $isHighlighted?: boolean }>`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ $isHighlighted }) => $isHighlighted ? '#5EEAD4' : '#E2E8F0'};
  margin-bottom: 0.5rem;
  margin-top: -1rem;
  margin-left: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(167, 139, 250, 0.1);

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;
const ExamContent = styled.div`
  display: flex;
  @media (max-width: 900px) {
    flex-direction: column;
    gap: 2rem;
  }
`;
const ExamCol = styled.div`
  flex: 1;
  min-width: 230px;
  background: rgba(20, 20, 35, 0.3);
  padding: 1rem 1.5rem;
  &:not(:first-child) {
    border-left: 1px solid rgba(167, 139, 250, 0.1);
  }

  @media (max-width: 900px) {
    &:not(:first-child) {
      border-left: none;
      border-top: 1px solid rgba(167, 139, 250, 0.1);
    }
  }
`;
const Label = styled.div`
  color: #94A3B8;
  font-size: 1.1rem;
  margin-top: -1rem;
  font-weight: 500;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;

`;

const ImageBox = styled.div`
  margin-top: 10/6rem;
  text-align: center;
`;
const ResultImg = styled.img`
  width: 180px;
  height: 180px;
  object-fit: contain;
  border-radius: 18px;
  background: #23263b;
  box-shadow: 0 2px 16px #a78bfa22;
  border: 1.5px solid #2d3154;
  display: inline-block;
`;


const ChatWindow = styled.div`
  background: rgba(20, 20, 35, 0.5);
  border: 1px solid rgba(167, 139, 250, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-thumb {
    background: #4B5563;
    border-radius: 8px;
  }
  &::-webkit-scrollbar-track { background: transparent; }
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: 80%;
  padding: 0.75rem 1.25rem;
  border-radius: 1.25rem;
  line-height: 1.6;
  font-size: 1rem;
  word-break: keep-all;

  align-self: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
  background: ${({ $isUser }) => ($isUser ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : '#374151')};
  color: white;

  border-bottom-left-radius: ${({ $isUser }) => ($isUser ? '1.25rem' : '0.25rem')};
  border-bottom-right-radius: ${({ $isUser }) => ($isUser ? '0.25rem' : '1.25rem')};
  
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
`;

const Suggestion = styled.div`
  color: #CBD5E1;
  font-size: 1rem;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
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

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 0;
    gap: 1rem;
  }
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
  width: 200px;

  &:hover {
    background: ${({ $pdf }) => ($pdf ? "#6D28D9" : "rgba(124, 58, 237, 0.15)")};
    border-color: ${({ $pdf }) => ($pdf ? "#6D28D9" : "rgba(167, 139, 250, 0.3)")};
  }

  @media (max-width: 640px) {
    width: 80%;
    max-width: 300px;
  }
`;
const BottomSpacer = styled.div`
  height: 130px;
`;

