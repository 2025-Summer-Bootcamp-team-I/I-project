import React, { useRef, useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import Background from "../components/Background";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useReportIdStore } from "../store/reportIdStore";
import html2pdf from "html2pdf.js";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'highcharts/highcharts-3d';
import { useReportStore } from "../store/reportStore";
import { useReportHistoryStore } from "../store/reportHistoryStore";
import lightbulbIcon from '../assets/imgs/lightbulb.png'; // 경계, 기본
import lightbulbBlueIcon from '../assets/imgs/lightbulb-blue.png'; // 양호
import lightbulbRedIcon from '../assets/imgs/lightbulb-red.png'; // 주의
import drawingExampleIcon from '../assets/imgs/ex.png';

// Highcharts Point 타입 확장
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

// --- Components ---

// 카드 컴포넌트 분리
interface ExamCardProps {
  exam: { name: string; summary: string; suggestion: string; image?: string; };
  status: '양호' | '경계' | '위험';
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

const ChatCard: React.FC<ExamCardProps> = ({ exam, status }) => {
  //const [scoreLine, ...chatLines] = exam.summary.split("\n").filter(line => line.trim());         // 대화 데이터 로직직
  //const scoreText = scoreLine?.replace("점수: ", "");
  const chatLines = [
    "사용자: 안녕하세요, 오늘 날씨가 좋네요.",
    "AI: 안녕하세요! 네, 정말 화창한 날씨예요. 기분 좋은 하루 보내고 계신가요?",
    "사용자: 덕분에 기분이 좋네요. 혹시 간단한 기억력 테스트 같은 걸 해볼 수 있을까요?",
    "AI: 물론이죠! 제가 몇 가지 단어를 불러드리면, 잠시 후에 순서대로 기억해서 말씀해주시겠어요? 준비되셨나요?",
    "사용자: 네, 준비됐어요.",
    "AI: 좋습니다. 첫 번째 단어는 '하늘', 두 번째는 '강아지', 세 번째는 '책상'입니다. 이제 제가 불렀던 단어들을 순서대로 말씀해주세요.",
    "사용자: 하늘, 강아지, 책상.",
    "AI: 정확합니다! 아주 잘 기억하고 계시네요."
  ];
  return (
    <ExamCard>
      <StatusBadge status={status}>{status}</StatusBadge>
      <ExamName $isHighlighted>{exam.name}</ExamName>
      <ExamContent>
        <ExamCol>
          <Label>대화 내용</Label>
          <ChatWindow>
            {chatLines.map((line, i) => {
              const isUser = line.startsWith("사용자:");
              const message = line.substring(line.indexOf(":") + 1).trim();
              
              if (!message) return null;

              return (
                <MessageBubble key={i} $isUser={isUser}>
                  {message}
                </MessageBubble>
              );
            })}
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
  const pdfRef = useRef<HTMLDivElement>(null);
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  const resetReportId = useReportIdStore((state) => state.resetReportId);
  const { width: windowWidth } = useWindowSize();

  // zustand에서 report와 addReport 불러옴
  const report = useReportStore((state) => state.report);
  const addReport = useReportHistoryStore((state) => state.addReport);

  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState(0);

  const drawingStatus = '경계';
  const dialogStatus = '양호';
  const surveyStatus = '양호';

  const getLightbulbIcon = () => {
    const statuses: ('양호' | '경계' | '위험')[] = [drawingStatus, dialogStatus, surveyStatus];
    const counts = {
      '양호': statuses.filter(s => s === '양호').length,
      '경계': statuses.filter(s => s === '경계').length,
      '위험': statuses.filter(s => s === '위험').length,
    };

    if (counts['양호'] >= 2) return lightbulbBlueIcon;
    if (counts['위험'] >= 2) return lightbulbRedIcon;
    return lightbulbIcon; // 2개 이상 경계, 모두 다른 경우
  };

  const selectedLightbulbIcon = getLightbulbIcon();

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgDimensions({ width: img.width, height: img.height });
    };
    img.src = selectedLightbulbIcon;
  }, [selectedLightbulbIcon]);

  const ad8Score = 2; // 임의의 값
  const maxAD8Score = 8;
  const radius = 62;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const progressOffset = circumference - (ad8Score / maxAD8Score) * circumference;
    const timer = setTimeout(() => setOffset(progressOffset), 100);
    return () => clearTimeout(timer);
  }, [ad8Score, circumference]);

  useEffect(() => {
    if (chartComponentRef.current && chartComponentRef.current.chart) {
      chartComponentRef.current.chart.reflow();
    }
  }, [windowWidth]);

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

  const summaryText = "전반적인 인지 기능이 '경계' 수준으로 나타났습니다. 일부 영역에서 약간의 저하가 관찰되나, 일상생활에 큰 영향을 미칠 정도는 아닙니다. 보고서의 영역별 제안을 참고하여 부족한 부분을 보완하고, 주기적인 인지 건강 점검을 통해 변화를 관찰하는 것이 중요합니다.";

  const getStatusColor = (status: '양호' | '경계' | '위험') => {
    if (status === '양호') return '#18A092';
    if (status === '경계') return '#F7D46E';
    return '#EE0000';
  };

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
          if (imgDimensions.width === 0 || imgDimensions.height === 0) {
            return; // Don't render image until dimensions are loaded
          }

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
          const yOffset = 80; // 이미지를 위로 올릴 값
          const xOffset = -1; // 이미지를 왼쪽으로 옮길 값

          if ((this as any).customImage) {
            (this as any).customImage.attr({
              x: centerX - newWidth / 2 - xOffset,
              y: centerY - newHeight / 2 - yOffset,
              width: newWidth,
              height: newHeight,
            }).toFront();
          } else {
            (this as any).customImage = this.renderer.image(
              selectedLightbulbIcon,
              centerX - newWidth / 2 - xOffset,
              centerY - newHeight / 2 - yOffset,
              newWidth,
              newHeight
            )
            .attr({ opacity: 0 })
            .add()
            .toFront();

            (this as any).customImage.animate(
              {
                opacity: 1,
              },
              {
                duration: 800,
              }
            );
          }
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
          afterAnimate: function(this: Highcharts.Series) {
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
            const pointOptions = this.options as { description?: string, status?: '양호' | '경계' | '위험' };
            let statusText = pointOptions.status || '위험';
            let statusClass = '';
            let statusColor = '';
            
            switch (statusText) {
              case '위험':
                statusText = '위험';
                statusClass = 'status-danger';
                statusColor = '#EF4444';
                break;
              case '경계':
                statusClass = 'status-warning';
                statusColor = '#FBBF24';
                break;
              case '양호':
                statusClass = 'status-safe';
                statusColor = '#22C55E';
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
                          <span class="status ${statusClass}" style="font-size: 16px;">
                            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${statusColor}; margin-right: 5px; vertical-align: middle;"></span><span style="vertical-align: middle;">${statusText}</span>
                          </span>
                        </b>
                        <span class="description">${pointOptions.description || ''}</span>
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
        { name: '그림 검사', y: 33, color: getStatusColor(drawingStatus), sliced: true, status: drawingStatus, description: '도형을 그리는 과정에서 어려움이 있었다면 주의력이나 시공간 능력 저하일 수 있습니다. 꾸준히 퍼즐이나 그리기 활동을 해보세요.' },
        { name: '대화 검사', y: 33, color: getStatusColor(dialogStatus), sliced: true, status: dialogStatus, description: '대화의 흐름을 이해하고 적절하게 반응하는 능력이 우수합니다. 꾸준히 대화하고 책을 읽는 습관을 가지면 더욱 좋습니다.' },
        { name: '설문 검사 (AD-8)', y: 34, color: getStatusColor(surveyStatus), sliced: true, status: surveyStatus, description: '최근 기억력이나 판단력의 변화를 스스로 점검하는 것은 매우 중요합니다. 변화가 감지된 항목에 주의를 기울이며 일상 생활을 관찰해보세요.' },
      ]
    }],
    legend: {
      enabled: false,
      itemHoverStyle: {
        color: '#FFFFFF'
      },
      itemHiddenStyle: {
        color: '#666666'
      },
      layout: windowWidth > 640 ? 'horizontal' : 'vertical',
      align: windowWidth > 640 ? 'center' : 'left',
      verticalAlign: windowWidth > 640 ? 'bottom' : 'middle',
    },
    credits: {
      enabled: false
    }
  };


  interface ExamResult {
    name: string;
    summary: string;
    suggestion: string;
    image?: string;
    status: '양호' | '경계' | '위험';
  }

  // 각 검사별 요약
  const examResults: ExamResult[] = [
    {
      name: "설문 검사 (AD-8)",
      summary: "2/8",
      suggestion: "최근 기억력이나 판단력의 변화를 스스로 점검하는 것이 중요합니다. 변화가 감지된다면 주의를 기울이고 일상생활을 관찰해보세요.",
      status: surveyStatus,
    },
    {
      name: "대화 검사",
      summary: "점수: 45 / 100",
      suggestion: "대화의 흐름을 이해하고 적절하게 반응하는 능력이 우수합니다. 꾸준히 대화하고 책을 읽는 습관을 가지면 더욱 좋습니다.",
      status: dialogStatus,
    },
    {
      name: "그림 검사",
      summary: "시계 그림 평가: 경계",
      suggestion: "도형을 그리는 과정에서 어려움이 있었다면 주의력이나 시공간 능력 저하일 수 있습니다. 꾸준히 퍼즐이나 그리기 활동을 해보세요.",
      image: drawingExampleIcon,
      status: drawingStatus,
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
              <SummaryText>{summaryText}</SummaryText>
            </OverallSummaryCard>

            {/* 검사별 요약 */}
            <SectionTitle>검사별 결과 및 해석</SectionTitle>
            {examResults.map((exam, idx) => {
              const status = exam.status;
              if (exam.name === "설문 검사 (AD-8)") {
                return <AD8Card key={idx} exam={exam} status={status} ad8Score={ad8Score} maxAD8Score={maxAD8Score} offset={offset} />;
              }
              if (exam.name === "대화 검사") {
                return <ChatCard key={idx} exam={exam} status={status} />;
              }
              if (exam.name === "그림 검사") {
                return <DrawingCard key={idx} exam={exam} status={status} />;
              }
              return null;
            })}
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

const ProgressCircle = styled(ProgressCircleBase)<{ $offset: number }>`
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
  font-size: 0.9rem;
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

