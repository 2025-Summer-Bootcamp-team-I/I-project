import React, { useRef, useEffect, useState, useMemo } from "react";
import styled, { createGlobalStyle } from "styled-components";
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
import lightbulbIcon from '../assets/imgs/lightbulb.png';

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
      position: relative;
      left: -30px;
      text-align: right;
    }

    &.drawing-label {
      position: relative;
      left: 30px;
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

    &.drawing-label b { color: #EE0000; }
    &.dialog-label b { color: #18A092; }
    &.survey-label b { color: #F7D46E; }

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
    text-outline: none !important;
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

// 카드 컴포넌트 분리
interface ExamCardProps {
  exam: { name: string; summary: string; suggestion: string; image?: string; };
  status: '양호' | '경계' | '주의';
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

const ChatCard: React.FC<ExamCardProps> = ({ exam, status }) => (
  <ExamCard>
    <StatusBadge status={status}>{status}</StatusBadge>
    <ExamName $isHighlighted>{exam.name}</ExamName>
    <ExamContent>

      <ExamCol>
        <Label>분석 및 제안</Label>
        <Suggestion>{exam.suggestion}</Suggestion>
      </ExamCol>
    </ExamContent>
  </ExamCard>
);

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

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgDimensions({ width: img.width, height: img.height });
    };
    img.src = lightbulbIcon;
  }, []);

  const parseAD8Score = (summary: string | undefined): number => {
    if (!summary) return 0;
    const match = summary.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };
  
  const ad8Score = useMemo(() => parseAD8Score(report?.ad8test_result), [report]);
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

  const overallScore = (report.memory_score + report.Judgment_score + report.language_score + report.text_score + report.Time_Space_score + report.visual_score) / 6;

  let summaryText = "";
  if (overallScore >= 80) {
    summaryText = "전반적인 인지 기능이 양호한 수준으로 유지되고 있습니다. 기억력, 언어 능력, 시공간 능력 등 모든 영역에서 안정적인 모습을 보여주셨습니다. 현재의 좋은 상태를 유지하기 위해 꾸준한 두뇌 활동과 건강한 생활 습관을 이어 나가시는 것을 추천합니다.";
  } else if (overallScore >= 50) {
    summaryText = "전반적인 인지 기능이 '경계' 수준으로 나타났습니다. 일부 영역에서 약간의 저하가 관찰되나, 일상생활에 큰 영향을 미칠 정도는 아닙니다. 보고서의 영역별 제안을 참고하여 부족한 부분을 보완하고, 주기적인 인지 건강 점검을 통해 변화를 관찰하는 것이 중요합니다.";
  } else {
    summaryText = "전반적인 인지 기능 저하가 우려되는 '주의' 단계입니다. 특히 보고서에서 '위험'으로 표시된 영역에 대한 세심한 관리가 필요합니다. 일상생활에서의 불편함이 느껴지신다면 전문가와의 상담을 통해 정확한 상태를 파악하고 조기에 관리하는 것을 적극적으로 권장합니다.";
  }

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
          const yOffset = 72; // 이미지를 위로 올릴 값
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
              lightbulbIcon,
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
            const pointOptions = this.options as { description?: string };
            let statusText = '';
            let statusClass = '';
            
            switch (this.color) {
              case '#EE0000':
                statusText = '위험';
                statusClass = 'status-danger';
                break;
              case '#F7D46E':
                statusText = '경계';
                statusClass = 'status-warning';
                break;
              case '#18A092':
                statusText = '양호';
                statusClass = 'status-safe';
                break;
            }

            const isDialog = this.color === '#18A092';
            const isDrawing = this.color === '#EE0000';
            
            let labelClass = 'custom-datalabel';
            if (isDialog) {
              labelClass += ' dialog-label';
            } else if (isDrawing) {
              labelClass += ' drawing-label';
            } else {
              labelClass += ' survey-label';
            }

            return `<div class="${labelClass}">
                        <b><span>${this.name}</span><span class="status ${statusClass}">(${statusText})</span></b>

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
        { name: '그림 검사', y: (report.memory_score + report.Judgment_score) / 2, color: '#EE0000', sliced: true, description: '도형을 그리는 과정에서 어려움이 있었다면 주의력이나 시공간 능력 저하일 수 있습니다. 꾸준히 퍼즐이나 그리기 활동을 해보세요.' },
        { name: '대화 검사', y: (report.language_score + report.text_score) / 2, color: '#18A092', sliced: true, description: '대화의 흐름을 이해하고 적절하게 반응하는 능력이 우수합니다. 꾸준히 대화하고 책을 읽는 습관을 가지면 더욱 좋습니다.' },
        { name: '설문 검사 (AD-8)', y: (report.Time_Space_score + report.visual_score) / 2, color: '#F7D46E', sliced: true, description: '최근 기억력이나 판단력의 변화를 스스로 점검하는 것은 매우 중요합니다. 변화가 감지된 항목에 주의를 기울이며 일상 생활을 관찰해보세요.' },
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

  const getStatusForExam = (exam: typeof examResults[0]): '양호' | '경계' | '주의' => {
    switch (exam.name) {
      case "설문 검사 (AD-8)":
        return exam.summary.includes("정상") ? '양호' : '주의';
      case "대화 검사":
        if (report.text_score >= 80) return '양호';
        if (report.text_score >= 50) return '경계';
        return '주의';
      case "그림 검사":
        return exam.summary.includes("정상") ? '양호' : '주의';
      default:
        return '주의';
    }
  };

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
              const status = getStatusForExam(exam);
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

const ProgressCircleBase = styled.circle`
  cx: 70px;
  cy: 70px;
  r: 62px;
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

const AD8SummaryText = styled.p`
  color: #E2E8F0;
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  line-height: 1.7;
`;

const StatusBadge = styled.div<{ status: '양호' | '경계' | '주의' }>`
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
const Summary = styled.div`
  color: #CBD5E1;
  font-size: 1.1rem;
  line-height: 1.7;
  white-space: pre-line;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
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

