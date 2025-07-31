import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Svg, { Circle, G } from 'react-native-svg';
import styled from 'styled-components/native';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius, commonStyles } from '../AppStyle';
import { useReportIdStore } from '../store/reportIdStore';
import { useReportStore } from '../store/reportStore';
import { useReportHistoryStore } from '../store/reportHistoryStore';
import { getReportResult, getChatLogs, finalizeReport, getBaseURL } from '../api';
import type { ChatLogResponse } from '../types/api';
import type { ReportResponse } from '../store/reportStore';
import AppHeader from '../components/AppHeader';
import BottomBar from '../components/BottomBar';
import LoadingPage from './LoadingPage';

// lightbulb 이미지 에셋들 - require 사용
import lightbulbBlue from '../assets/imgs/lightbulb-blue.png';
import lightbulb from '../assets/imgs/lightbulb.png';
import lightbulbRed from '../assets/imgs/lightbulb-red.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type ReportPageNavigationProp = StackNavigationProp<RootStackParamList, 'Report'>;
type ReportPageRouteProp = RouteProp<RootStackParamList, 'Report'>;



// 상태별 색상 함수
const getStatusColor = (status: '양호' | '경계' | '위험') => {
  if (status === '양호') return '#18A092';
  if (status === '경계') return '#F7D46E';
  return '#EE0000';
};

// 상태별 배경색 함수
const getStatusBackgroundColor = (status: '양호' | '경계' | '위험') => {
  if (status === '양호') return 'rgba(34, 197, 94, 0.1)';
  if (status === '경계') return 'rgba(251, 191, 36, 0.1)';
  return 'rgba(239, 68, 68, 0.1)';
};



// AD8 원형 진행바 컴포넌트
const AD8CircularProgress: React.FC<{ score: number; maxScore: number }> = ({ score, maxScore }) => {
  const progress = Math.min(score / maxScore, 1);
  const radius = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <CircularProgressContainer>
      <Svg width={150} height={150}>
        {/* 배경 원 */}
        <Circle
          cx={75}
          cy={75}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* 진행 원 */}
        <Circle
          cx={75}
          cy={75}
          r={radius}
          stroke="#8B5CF6"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 75 75)`}
        />
      </Svg>
             <CircularProgressTextContainer style={{ transform: [{ translateX: -50 }, { translateY: -30 }] }}>
         <CircularProgressScore>{score} / {maxScore}</CircularProgressScore>
         <CircularProgressLabel>획득 점수</CircularProgressLabel>
       </CircularProgressTextContainer>
    </CircularProgressContainer>
  );
};

// 개선된 3D 스타일 원형 차트 컴포넌트
const SimplePieChart: React.FC<{
  data: Array<{ name: string; value: number; status: '양호' | '경계' | '위험' }>;
  finalRisk: '양호' | '경계' | '위험';
}> = ({ data, finalRisk }) => {
  // 각 검사 결과에 따른 색상 결정
  const getChartColor = (status: '양호' | '경계' | '위험') => {
    let color;
    switch (status) {
      case '양호': 
        color = '#18A092';
        break;
      case '경계': 
        color = '#F7D46E';
        break;
      case '위험': 
        color = '#EE0000';
        break;
      default: 
        color = '#F7D46E';
        break;
    }
    return color;
  };

  // 최종 분석 결과에 따른 전구 이미지 결정
  const getLightbulbImage = (risk: '양호' | '경계' | '위험') => {
    switch (risk) {
      case '양호': return lightbulbBlue;
      case '경계': return lightbulb;
      case '위험': return lightbulbRed;
      default: return lightbulb;
    }
  };

  // SVG 도넛 차트를 위한 상수 - 크기 증가
  const size = 280;
  const radius = 100;
  const strokeWidth = 50;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / 3; // 3개 세그먼트, 각각 120도

  return (
    <ChartContainer>
      <Svg width={size} height={size}>
        
        {/* 배경 원 */}
        <Circle
          cx={center}
          cy={center}
          r={radius + strokeWidth / 2}
          fill="rgba(20, 20, 35, 0.3)"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="2"
        />
        
        {/* 3개 세그먼트 그리기 */}
        {data.map((item, index) => {
          const startOffset = index * segmentLength;
          const rotation = -90; // 각 세그먼트를 120도씩 회전
          const segmentColor = getChartColor(item.status);
          
          return (
              <G key={index}>
                {/* 그림자 레이어 */}
                <Circle
                  cx={center + 2}
                  cy={center + 2}
                  r={radius}
                  stroke="rgba(0, 0, 0, 0.3)"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={`${segmentLength} ${circumference}`}
                  strokeDashoffset={-startOffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${center + 2} ${center + 2})`}
                />
                {/* 메인 세그먼트 - 직접 색상 사용 */}
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={segmentColor}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={`${segmentLength} ${circumference}`}
                  strokeDashoffset={-startOffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${center} ${center})`}
                />
              </G>
          );
        })}
        
        {/* 중앙 원 (전구 이미지 배경) */}
        <Circle
          cx={center}
          cy={center}
          r={radius - 10}
          fill="rgba(20, 20, 35, 0.8)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="2"
        />
      </Svg>
      
      {/* 중앙 전구 이미지 - 가운데 정렬 수정 */}
      <LightbulbImageContainer style={{ transform: [{ translateX: -75 }, { translateY: -75 }] }}>
        <LightbulbImage 
          source={getLightbulbImage(finalRisk)}
          style={{ width: 150, height: 150 }}
          resizeMode="contain"
        />
      </LightbulbImageContainer>
      
      {/* 개선된 범례 */}
      <LegendContainer3D>
        {data.map((item, index) => (
          <LegendItem3D key={index}>
            <LegendDot3D style={{ backgroundColor: getChartColor(item.status) }} />
            <LegendText3D>{item.name}</LegendText3D>
          </LegendItem3D>
        ))}
      </LegendContainer3D>
    </ChartContainer>
  );
};

// 간단한 최종 위험도 표시 컴포넌트
const FinalRiskDisplay: React.FC<{ finalRisk: '양호' | '경계' | '위험' }> = ({ finalRisk }) => {
  const getRiskColor = (status: '양호' | '경계' | '위험') => {
    switch (status) {
      case '양호': return '#18A092';
      case '경계': return '#F7D46E';
      case '위험': return '#EE0000';
      default: return '#F7D46E';
    }
  };

  return (
    <FinalRiskContainer>
      <View style={{
        backgroundColor: getRiskColor(finalRisk),
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: 8,
        }}>
          {finalRisk}
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#fff',
          textAlign: 'center',
        }}>
          최종 인지 위험도
        </Text>
        <Text style={{
          fontSize: 14,
          color: '#fff',
          textAlign: 'center',
          marginTop: 4,
        }}>
          {finalRisk === '양호' && '인지 기능이 양호한 상태입니다.'}
          {finalRisk === '경계' && '인지 기능 변화에 주의가 필요합니다.'}
          {finalRisk === '위험' && '전문가 상담을 권장합니다.'}
        </Text>
      </View>
    </FinalRiskContainer>
  );
};

// 검사 결과 카드 컴포넌트
const ExamCard: React.FC<{
  title: string;
  status: '양호' | '경계' | '위험';
  children: React.ReactNode;
}> = ({ title, status, children }) => (
  <ExamCardContainer style={{ borderColor: getStatusColor(status) + '20' }}>
    <ExamCardHeader>
      <ExamCardTitle>{title}</ExamCardTitle>
      <StatusBadge style={{ backgroundColor: getStatusBackgroundColor(status) }}>
        <StatusText style={{ color: getStatusColor(status) }}>위험도: {status}</StatusText>
      </StatusBadge>
    </ExamCardHeader>
    {children}
  </ExamCardContainer>
);

// 채팅 메시지 컴포넌트
const ChatMessage: React.FC<{ message: string; isUser: boolean }> = ({ message, isUser }) => (
  <ChatMessageContainer isUser={isUser}>
    <ChatMessageText>{message}</ChatMessageText>
  </ChatMessageContainer>
);

export default function ReportPage() {
  const navigation = useNavigation<ReportPageNavigationProp>();
  const route = useRoute<ReportPageRouteProp>();
  const reportId = route.params?.reportId;
  const resetReportId = useReportIdStore((state) => state.resetReportId);
  
  // store들 사용
  const { report: reportFromStore, setReport: setReportToStore } = useReportStore();
  const addReport = useReportHistoryStore((state) => state.addReport);
  
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [chatLogs, setChatLogs] = useState<ChatLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // 애니메이션 값들
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const fetchReportData = async () => {
      if (!reportId) {
        setError("리포트 ID가 없습니다.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // 1. 먼저 현재 리포트 상태 확인
        const currentReportData = await getReportResult(Number(reportId));
        
        // 2. 모든 검사가 완료되었는지 확인
        if (!currentReportData.ad8_risk || !currentReportData.drawing_risk || !currentReportData.chat_risk) {
          setError("모든 검사(AD8, 그림, 채팅)를 완료해야 리포트를 생성할 수 있습니다.");
          setIsLoading(false);
          return;
        }
        
        // 3. 리포트 최종화
        await finalizeReport(Number(reportId));
        
        // 4. 최종 리포트 데이터 가져오기
        const reportData = await getReportResult(Number(reportId));
        setReport(reportData as any); // 타입 캐스팅으로 해결
        setReportToStore(reportData); // store에 저장
        
        // 5. 채팅 로그 가져오기
 
        const chatLogsData = await getChatLogs(Number(reportId));

        setChatLogs(chatLogsData || []);
        
     
       
        
      } catch (err) {

        setError(`리포트를 불러오는 데 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [reportId]);

  // 웹 환경에서 스크롤바 스타일 제거 - React Native에서는 불필요

  // 히스토리에 리포트 추가
  useEffect(() => {
    if (report && reportId) {
      const reportWithId = {
        ...report,
        report_id: report.report_id || Number(reportId),
        drawing_image_url: report.drawing_image_url || '' // null을 빈 문자열로 변환
      } as any; // 타입 호환성을 위해 any로 캐스팅
      addReport(reportWithId);
    }
  }, [report, reportId, addReport]);

  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading]);

  const handleBackToMain = () => {
    resetReportId();
    navigation.navigate('Main');
  };

  // PDF 다운로드 함수
  const generatePDF = async () => {
    if (!report) {
      Alert.alert('오류', '리포트 데이터가 없습니다.');
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // HTML 템플릿 생성
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>인지 건강 리포트</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f5f5f5;
              color: #333;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #8B5CF6;
              padding-bottom: 20px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              color: #8B5CF6;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 16px;
              color: #666;
              font-style: italic;
            }
            .summary-section {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
              border-left: 4px solid #8B5CF6;
            }
            .risk-level {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              margin: 10px 0;
            }
            .risk-good { background-color: #18A092; color: white; }
            .risk-warning { background-color: #F7D46E; color: #333; }
            .risk-danger { background-color: #EE0000; color: white; }
            .exam-section {
              margin-bottom: 25px;
              border: 1px solid #ddd;
              border-radius: 8px;
              overflow: hidden;
            }
            .exam-header {
              background-color: #f8f9fa;
              padding: 15px;
              border-bottom: 1px solid #ddd;
            }
            .exam-title {
              font-size: 18px;
              font-weight: bold;
              color: #5EEAD4;
              margin: 0;
            }
            .exam-content {
              padding: 20px;
            }
            .exam-result {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 15px;
            }
                                 .chat-log {
                       background-color: #f8f9fa;
                       padding: 15px;
                       border-radius: 5px;
                       margin-bottom: 15px;
                     }
            .chat-message {
              margin-bottom: 10px;
              padding: 8px 12px;
              border-radius: 8px;
            }
            .chat-user {
              background-color: #06B6D4;
              color: white;
              margin-left: 20%;
            }
            .chat-ai {
              background-color: #374151;
              color: white;
              margin-right: 20%;
            }
            .drawing-image {
              text-align: center;
              margin: 15px 0;
            }
            .drawing-image img {
              max-width: 200px;
              max-height: 200px;
              border-radius: 10px;
              border: 2px solid #8B5CF6;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">최종 분석 리포트</h1>
              <p class="subtitle">"당신의 인지 건강, 지금 어떤 상태인가요?"</p>
            </div>

            <div class="summary-section">
              <h2>종합 인지 기능 평가 결과</h2>
              <div class="risk-level risk-${report.final_risk === '양호' ? 'good' : report.final_risk === '경계' ? 'warning' : 'danger'}">
                ${report.final_risk} - 최종 인지 위험도
              </div>
              <p>${report.final_result || '종합 인지 결과가 없습니다.'}</p>
            </div>

            <div class="exam-section">
              <div class="exam-header">
                <h3 class="exam-title">설문 검사 (AD-8)</h3>
              </div>
              <div class="exam-content">
                <div class="exam-result">
                  <strong>점수:</strong> ${report.ad8_score} / 8<br>
                  <strong>위험도:</strong> ${report.ad8_risk}
                </div>
                <p><strong>분석 및 제안:</strong></p>
                <p>${report.ad8test_result || '설문 검사 결과가 없습니다.'}</p>
              </div>
            </div>

            <div class="exam-section">
              <div class="exam-header">
                <h3 class="exam-title">대화 검사</h3>
              </div>
              <div class="exam-content">
                <div class="exam-result">
                  <strong>위험도:</strong> ${report.chat_risk}
                </div>
                <div class="chat-log">
                  <strong>대화 기록:</strong><br>
                  ${chatLogs && chatLogs.length > 0 ? 
                    chatLogs
                      .filter(item => item.role === 'user' || item.role === 'ai')
                      .map(item => `
                        <div class="chat-message chat-${item.role}">
                          <strong>${item.role === 'user' ? '사용자' : 'AI'}:</strong> ${item.text}
                        </div>
                      `).join('') 
                    : '대화 기록이 없습니다.'
                  }
                </div>
                <p><strong>분석 및 제안:</strong></p>
                <p>${report.chat_result || '대화 검사 결과가 없습니다.'}</p>
              </div>
            </div>

            ${report.drawing_image_url ? `
            <div class="exam-section">
              <div class="exam-header">
                <h3 class="exam-title">그림 검사</h3>
              </div>
              <div class="exam-content">
                <div class="exam-result">
                  <strong>위험도:</strong> ${report.drawing_risk}
                </div>
                <div class="drawing-image">
                  <img src="${report.presigned_url || report.drawing_image_url}" alt="그림 검사 결과" />
                </div>
                <p><strong>분석 및 제안:</strong></p>
                <p>${report.drawingtest_result || '그림 검사 결과가 없습니다.'}</p>
              </div>
            </div>
            ` : ''}

            <div class="footer">
              <p>생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
              <p>이 리포트는 AI 기반 인지 건강 검사 결과입니다.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // 브라우저의 인쇄 기능을 사용하여 PDF로 저장
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // 이미지가 모두 로드된 후 인쇄 다이얼로그 열기
        const images = printWindow.document.querySelectorAll('img');
        if (images.length > 0) {
          let loadedImages = 0;
          const totalImages = images.length;
          
          const checkAllImagesLoaded = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
              // 모든 이미지가 로드되면 인쇄 다이얼로그 열기
              setTimeout(() => {
                printWindow.print();
                printWindow.close();
              }, 1000);
            }
          };
          
          images.forEach((img) => {
            if (img.complete) {
              checkAllImagesLoaded();
            } else {
              img.onload = checkAllImagesLoaded;
              img.onerror = checkAllImagesLoaded; // 에러가 나도 계속 진행
            }
          });
        } else {
          // 이미지가 없으면 바로 인쇄
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        }
        
        Alert.alert(
          'PDF 생성',
          '브라우저의 인쇄 다이얼로그가 열렸습니다. "대상"을 "PDF로 저장"으로 설정하고 저장하세요.',
          [
            { text: '확인', style: 'default' }
          ]
        );
      } else {
        Alert.alert('오류', '팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('오류', `PDF 생성 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error || !report) {
    return (
      <ErrorContainer>
        <ErrorText>{error || "리포트 데이터가 없습니다."}</ErrorText>
        <ErrorButton onPress={handleBackToMain}>
          <ErrorButtonText>메인으로 돌아가기</ErrorButtonText>
        </ErrorButton>
      </ErrorContainer>
    );
  }


  
  const chartData = [
    { name: 'AD8', value: 1, status: (report.ad8_risk || '경계') as '양호' | '경계' | '위험' },
    { name: '대화검사', value: 1, status: (report.chat_risk || '경계') as '양호' | '경계' | '위험' },
    { name: '그림검사', value: 1, status: (report.drawing_risk || '경계') as '양호' | '경계' | '위험' },
  ] as Array<{ name: string; value: number; status: '양호' | '경계' | '위험' }>;



  const finalRisk = (report.final_risk || '경계') as '양호' | '경계' | '위험';

  return (
    <Container>
      <AppHeader showLogoText={true} />
      <ScrollViewStyled showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            {
              padding: spacing.md,
              paddingTop: spacing.xxxl,
              paddingBottom: spacing.xxxl,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
                     {/* 헤더 */}
           <Header>
             <Title>최종 분석 리포트</Title>
             <Subtitle>"당신의 인지 건강, 지금 어떤 상태인가요?"</Subtitle>
           </Header>

           {/* 종합 인지 결과 텍스트 - 헤더와 차트 사이에 배치 */}
           <ComprehensiveResultContainer>
             <ComprehensiveResultText>종합 인지 결과</ComprehensiveResultText>
             <ComprehensiveResultIndicator>
               <ComprehensiveResultDot style={{ backgroundColor: getStatusColor(finalRisk) }} />
               <ComprehensiveResultStatus style={{ color: getStatusColor(finalRisk) }}>
                 {finalRisk}
               </ComprehensiveResultStatus>
             </ComprehensiveResultIndicator>
           </ComprehensiveResultContainer>

                     {/* 종합 결과 차트 */}
           <SimplePieChart data={chartData} finalRisk={finalRisk} />

           {/* 위험도 분류표 */}
           <RiskClassificationCard>
             <RiskClassificationHeader>
               <RiskClassificationTitle>위험도 분류표</RiskClassificationTitle>
               <RiskClassificationSubtitle>검사 결과에 따른 위험도 분류 기준</RiskClassificationSubtitle>
             </RiskClassificationHeader>
             <RiskClassificationList>
               <RiskClassificationItem>
                
                   <RiskClassificationDot style={{ backgroundColor: '#EE0000' }} />
                 
                 <RiskClassificationContent>
                   <RiskClassificationLabel>위험</RiskClassificationLabel>
                   <RiskClassificationDescription>
                     인지 저하가 의심되어 전문가의 진단이 필요합니다.
                   </RiskClassificationDescription>
                 </RiskClassificationContent>
               </RiskClassificationItem>
               <RiskClassificationItem>
                 
                   <RiskClassificationDot style={{ backgroundColor: '#F7D46E' }} />
                 
                 <RiskClassificationContent>
                   <RiskClassificationLabel>경계</RiskClassificationLabel>
                   <RiskClassificationDescription>
                     최근 기억력이나 판단력의 변화를 스스로 점검하는 것은 매우 중요합니다. 변화가 감지된 항목에 주의를 기울이며 일상 생활을 관찰해보세요.
                   </RiskClassificationDescription>
                 </RiskClassificationContent>
               </RiskClassificationItem>
               <RiskClassificationItem>
                 
                   <RiskClassificationDot style={{ backgroundColor: '#18A092' }} />
                 
                 <RiskClassificationContent>
                   <RiskClassificationLabel>양호</RiskClassificationLabel>
                   <RiskClassificationDescription>
                     대화의 흐름을 이해하고 적절하게 반응하는 능력이 우수합니다. 언어 이해 및 표현력이 양호합니다.
                   </RiskClassificationDescription>
                 </RiskClassificationContent>
               </RiskClassificationItem>
             </RiskClassificationList>
           </RiskClassificationCard>

           {/* 종합 인지 기능 평가 결과 */}
           <SummaryCard>
             <SummaryTitle>종합 인지 기능 평가 결과</SummaryTitle>
             <SummaryContent>
               <SummaryText>
                 {report.final_result || '종합 인지 결과가 없습니다.'}
               </SummaryText>
             </SummaryContent>
           </SummaryCard>

          {/* 검사별 결과 */}
          <SectionTitle>검사별 결과 및 해석</SectionTitle>

          {/* AD8 설문 검사 */}
          <ExamCard title="설문 검사 (AD-8)" status={(report.ad8_risk || '경계') as '양호' | '경계' | '위험'}>
            <ExamContent>
                             <ExamCol>
                 <ExamLabel>결과 요약</ExamLabel>
                 <AD8CircularProgress score={report.ad8_score} maxScore={8} />
               </ExamCol>
              <ExamCol>
                <ExamLabel>분석 및 제안</ExamLabel>
                <ExamSuggestion>{report.ad8test_result || ''}</ExamSuggestion>
              </ExamCol>
            </ExamContent>
          </ExamCard>

          {/* 대화 검사 */}
          <ExamCard title="대화 검사 (AD-8)" status={(report.chat_risk || '경계') as '양호' | '경계' | '위험'}>
            <DrawingExamContent>
              <DrawingExamSection>
                                        <ExamLabel>결과 요약</ExamLabel>
                        <ChatWindowContainer>
                          <ChatWindow 
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled={true}
                          >
                            {chatLogs && chatLogs.length > 0 ? (
                      chatLogs
                        .filter(item => item.role === 'user' || item.role === 'ai')
                        .map((item, index) => (
                            <ChatMessage
                              key={index}
                              message={item.text || ''}
                              isUser={item.role === 'user'}
                            />
                          ))
                    ) : (
                      <NoChatContainer>
                        <NoChatText>대화 기록을 불러올 수 없습니다.</NoChatText>
                        <NoChatSubText>
                          채팅 로그 개수: {chatLogs ? chatLogs.length : 0}
                        </NoChatSubText>
                        <NoChatSubText>채팅 검사가 완료되지 않았거나 기록이 없습니다.</NoChatSubText>
                      </NoChatContainer>
                    )}
                  </ChatWindow>
                </ChatWindowContainer>
              </DrawingExamSection>
              <DrawingExamSection>
                <ExamLabel>분석 및 제안</ExamLabel>
                <AnalysisContainer
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  <ExamSuggestion>{report.chat_result}</ExamSuggestion>
                </AnalysisContainer>
              </DrawingExamSection>
            </DrawingExamContent>
          </ExamCard>

          {/* 그림 검사 */}
          {report.drawing_image_url && (
            <ExamCard title="그림 검사 (AD-8)" status={(report.drawing_risk || '경계') as '양호' | '경계' | '위험'}>
              <DrawingExamContent>
                <DrawingExamSection>
                  <ExamLabel>결과 요약</ExamLabel>
                  <DrawingContainer>
                    <DrawingImage
                      source={{
                        uri: report.presigned_url || report.drawing_image_url,
                        headers: {
                          'Accept': 'image/*',
                          'User-Agent': 'ReactNative',
                        },
                        cache: 'reload'
                      }}
                      resizeMode="contain"
                       
                    />
                  </DrawingContainer>
                </DrawingExamSection>
                <DrawingExamSection>
                  <ExamLabel>분석 및 제안</ExamLabel>
                  <AnalysisContainer
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <ExamSuggestion>
                      {report.drawingtest_result || '그림 검사 결과가 없습니다.'}
                    </ExamSuggestion>
                  </AnalysisContainer>
                </DrawingExamSection>
              </DrawingExamContent>
            </ExamCard>
          )}

          {/* 액션 버튼 */}
          <ActionContainer>
            <ActionButtonRow>
              <ActionButton
                onPress={handleBackToMain}
                activeOpacity={0.8}
                style={{ 
                  backgroundColor: isGeneratingPDF ? '#6B7280' : '#374151',
                  opacity: isGeneratingPDF ? 0.6 : 1
                }}
                disabled={isGeneratingPDF}
              >
                <ActionButtonText>다시하기</ActionButtonText>
              </ActionButton>
              <ActionButton
                onPress={generatePDF}
                activeOpacity={0.8}
                style={{ 
                  backgroundColor: isGeneratingPDF ? '#6B7280' : '#8B5CF6',
                  opacity: isGeneratingPDF ? 0.6 : 1
                }}
                disabled={isGeneratingPDF}
              >
                <ActionButtonText>
                  {isGeneratingPDF ? 'PDF 생성 중...' : 'PDF로 저장'}
                </ActionButtonText>
              </ActionButton>
            </ActionButtonRow>
          </ActionContainer>
        </Animated.View>
      </ScrollViewStyled>
      <BottomBar currentPage="Report" />
    </Container>
  );
}

// Styled Components
const Container = styled.View`
  flex: 1;
  background-color: ${colors.background};
`;



const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${colors.background};
  padding: ${spacing.lg}px;
`;

const ErrorText = styled.Text`
  font-size: ${fontSize.lg}px;
  color: ${colors.error};
  text-align: center;
  margin-bottom: ${spacing.lg}px;
`;

const ErrorButton = styled.TouchableOpacity`
  background-color: ${colors.primary};
  padding-vertical: ${spacing.md}px;
  padding-horizontal: ${spacing.xl}px;
  border-radius: ${borderRadius.round}px;
`;

const ErrorButtonText = styled.Text`
  color: ${colors.text};
  font-size: ${fontSize.md}px;
  font-weight: 600;
`;

const ScrollViewStyled = styled.ScrollView`
  flex: 1;
`;

const Header = styled.View`
  align-items: center;
  margin-bottom: ${spacing.xl}px;
  margin-top: ${spacing.lg}px;
`;



const Title = styled.Text`
  font-size: ${fontSize.xxxl}px;
  font-weight: 700;
  color: #C4B5FD;
  text-align: center;
  margin-top: ${spacing.lg}px;
`;

const Subtitle = styled.Text`
  font-size: ${fontSize.md}px;
  color: ${colors.textSecondary};
  text-align: center;
  margin-top: ${spacing.sm}px;
  font-style: italic;
`;

const ChartContainer = styled.View`
  align-items: center;
  margin-bottom: ${spacing.xl}px;
  position: relative;
  height: 390px;
  justify-content: center;
`;

const ChartCenterText = styled.View`
  position: absolute;
  top: 50%;
  left: 50%;
  align-items: center;
  z-index: 10;
  width: 120px;
`;

const ChartMainText = styled.Text`
  font-size: ${fontSize.sm}px;
  color: ${colors.text};
  font-weight: 600;
  margin-bottom: ${spacing.xs}px;
  text-align: center;
`;

const RiskIndicator = styled.View`
  flex-direction: row;
  align-items: center;
`;

const RiskDot = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  margin-right: ${spacing.sm}px;
`;

const LegendContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  margin-top: ${spacing.md}px;
`;

const LegendItem = styled.View`
  flex-direction: row;
  align-items: center;
`;

const LegendDot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  margin-right: ${spacing.sm}px;
`;

const LegendText = styled.Text`
  font-size: ${fontSize.sm}px;
  color: ${colors.textSecondary};
`;

const SummaryCard = styled.View`
  background-color: ${colors.surface};
  border-radius: ${borderRadius.lg}px;
  padding: ${spacing.xl}px;
  margin-bottom: ${spacing.xl}px;
  border-width: 1px;
  border-color: rgba(167, 139, 250, 0.1);
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const SummaryTitle = styled.Text`
  font-size: ${fontSize.xl}px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: ${spacing.lg}px;
  text-align: center;
`;

const SummaryContent = styled.View`
  background-color: rgba(167, 139, 250, 0.05);
  border-radius: ${borderRadius.md}px;
  padding: ${spacing.lg}px;
  border-left-width: 4px;
  border-left-color: rgba(167, 139, 250, 0.3);
`;

const SummaryText = styled.Text`
  font-size: ${fontSize.lg}px;
  color: ${colors.text};
  line-height: ${fontSize.lg * 1.7}px;
  text-align: left;
  font-weight: 500;
`;

// 위험도 분류표 스타일
const RiskClassificationCard = styled.View`
  background-color: ${colors.surface};
  border-radius: ${borderRadius.lg}px;
  padding: ${spacing.xl}px;
  margin-bottom: ${spacing.xl}px;
  border-width: 1px;
  border-color: rgba(167, 139, 250, 0.1);
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 8px;
  elevation: 6;
`;

const RiskClassificationHeader = styled.View`
  margin-bottom: ${spacing.xl}px;
  align-items: center;
`;

const RiskClassificationTitle = styled.Text`
  font-size: ${fontSize.xl}px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: ${spacing.sm}px;
  text-align: center;
`;

const RiskClassificationSubtitle = styled.Text`
  font-size: ${fontSize.md}px;
  color: ${colors.textSecondary};
  text-align: center;
`;

const RiskClassificationList = styled.View`
  gap: ${spacing.lg}px;
`;

const RiskClassificationItem = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: ${spacing.lg}px;
  padding: ${spacing.lg}px;
  background-color: rgba(167, 139, 250, 0.05);
  border-radius: ${borderRadius.lg}px;
  border-left-width: 4px;
  border-left-color: rgba(167, 139, 250, 0.3);
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;


const RiskClassificationIcon = styled.Text`
  font-size: 24px;
  text-align: center;
`;

const RiskClassificationDotContainer = styled.View`
  padding: ${spacing.xs}px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: ${borderRadius.sm}px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`;

const RiskClassificationDot = styled.View`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  flex-shrink: 0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 4;
`;

const RiskClassificationContent = styled.View`
  flex: 1;
`;

const RiskClassificationLabel = styled.Text`
  font-size: ${fontSize.lg}px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: ${spacing.sm}px;
`;

const RiskClassificationDescription = styled.Text`
  font-size: ${fontSize.md}px;
  color: ${colors.textSecondary};
  line-height: ${fontSize.md * 1.6}px;
`;

const SectionTitle = styled.Text`
  font-size: ${fontSize.lg}px;
  font-weight: 600;
  color: #C4B5FD;
  margin-bottom: ${spacing.lg}px;
  text-align: left;
`;

const ExamCardContainer = styled.View`
  background-color: ${colors.surface};
  border-radius: ${borderRadius.lg}px;
  padding: ${spacing.lg}px;
  margin-bottom: ${spacing.lg}px;
  border-width: 1px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const ExamCardHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${spacing.md}px;
  padding-bottom: ${spacing.md}px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(167, 139, 250, 0.1);
`;

const ExamCardTitle = styled.Text`
  font-size: ${fontSize.lg}px;
  font-weight: 600;
  color: #5EEAD4;
`;

const StatusBadge = styled.View`
  padding-horizontal: ${spacing.sm}px;
  padding-vertical: ${spacing.xs}px;
  border-radius: ${borderRadius.sm}px;
`;

const StatusText = styled.Text`
  font-size: ${fontSize.sm}px;
  font-weight: 700;
`;

const ExamContent = styled.View`
  flex-direction: row;
  gap: ${spacing.lg}px;
`;

const ExamCol = styled.View`
  flex: 1;
  background-color: rgba(20, 20, 35, 0.3);
  padding: ${spacing.md}px;
  border-radius: ${borderRadius.md}px;
`;

const ExamLabel = styled.Text`
  font-size: ${fontSize.md}px;
  color: ${colors.textSecondary};
  margin-bottom: ${spacing.md}px;
  font-weight: 500;
`;

const ExamSuggestion = styled.Text`
  font-size: ${fontSize.md}px;
  color: ${colors.textSecondary};
  line-height: ${fontSize.md * 1.6}px;
`;

// AD8 원형 진행바 스타일
const CircularProgressContainer = styled.View`
  align-items: center;
  justify-content: center;
  margin-vertical: ${spacing.sm}px;
  position: relative;
`;

const CircularProgressTextContainer = styled.View`
  position: absolute;
  top: 50%;
  left: 50%;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 60px;
`;

const CircularProgressScore = styled.Text`
  font-size: ${fontSize.xl}px;
  font-weight: 700;
  color: ${colors.text};
  text-align: center;
`;

const CircularProgressLabel = styled.Text`
  font-size: ${fontSize.sm}px;
  color: ${colors.textSecondary};
  text-align: center;
  margin-top: ${spacing.xs}px;
`;

const ChatWindow = styled.ScrollView`
  flex: 1;
  padding: ${spacing.md}px;
`;

const ChatMessageContainer = styled.View<{ isUser: boolean }>`
  max-width: 80%;
  padding-vertical: ${spacing.sm}px;
  padding-horizontal: ${spacing.md}px;
  border-radius: ${borderRadius.lg}px;
  margin-bottom: ${spacing.sm}px;
  background-color: ${(props: { isUser: boolean }) => props.isUser ? '#06B6D4' : '#374151'};
  align-self: ${(props: { isUser: boolean }) => props.isUser ? 'flex-end' : 'flex-start'};
  border-bottom-right-radius: ${(props: { isUser: boolean }) => props.isUser ? borderRadius.sm : borderRadius.lg}px;
  border-bottom-left-radius: ${(props: { isUser: boolean }) => props.isUser ? borderRadius.lg : borderRadius.sm}px;
`;

const ChatMessageText = styled.Text`
  color: ${colors.text};
  font-size: ${fontSize.sm}px;
  line-height: ${fontSize.sm * 1.4}px;
`;

const NoChatText = styled.Text`
  color: ${colors.textSecondary};
  text-align: center;
  font-size: ${fontSize.md}px;
`;

const NoChatSubText = styled.Text`
  font-size: ${fontSize.sm}px;
  color: ${colors.textSecondary};
  margin-top: ${spacing.xs}px;
`;

const NoChatContainer = styled.View`
  justify-content: center;
  align-items: center;
  height: 150px;
  background-color: rgba(20, 20, 35, 0.3);
  border-radius: ${borderRadius.md}px;
  border-width: 1px;
  border-color: rgba(167, 139, 250, 0.1);
`;

const DrawingImage = styled.Image`
  width: 200px;
  height: 200px;
  border-radius: 20px;
  background-color: transparent;
  border-width: 2px;
  border-color: rgba(167, 139, 250, 0.3);
  shadow-color: #a78bfa;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 20px;
  elevation: 10;
`;

const DrawingContainer = styled.View`
  justify-content: center;
  align-items: center;
  height: 220px;
  background-color: rgba(20, 20, 35, 0.2);
  border-radius: ${borderRadius.lg}px;
  border-width: 1px;
  border-color: rgba(167, 139, 250, 0.1);
  padding: ${spacing.md}px;
`;

const ActionContainer = styled.View`
  align-items: center;
  margin-top: ${spacing.xl}px;
  margin-bottom: ${spacing.xxl}px;
`;

const ActionButtonRow = styled.View`
  flex-direction: row;
  gap: ${spacing.lg}px;
`;

const ActionButton = styled.TouchableOpacity`
  background-color: ${colors.primary};
  border-radius: ${borderRadius.round}px;
  padding-vertical: ${spacing.md}px;
  padding-horizontal: ${spacing.xl}px;
  shadow-color: ${colors.primary};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 8;
`;

const ActionButtonText = styled.Text`
  font-size: ${fontSize.md}px;
  font-weight: 600;
  color: ${colors.text};
`;

// 3D 차트 관련 스타일
const ChartBackground3D = styled.View`
  width: 220px;
  height: 220px;
  border-radius: 110px;
  background-color: rgba(20, 20, 35, 0.6);
  position: relative;
  overflow: hidden;
  margin-bottom: ${spacing.md}px;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 16px;
  elevation: 12;
`;

const ChartSegment3D = styled.View`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 120px;
  opacity: 0.4;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 8px;
  elevation: 6;
  z-index: 1;
`;

const LightbulbContainer = styled.View`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  justify-content: center;
  align-items: center;
`;

const LightbulbBase = styled.View`
  width: 24px;
  height: 32px;
  background-color: #8B5CF6;
  border-radius: 12px;
  position: absolute;
  bottom: 0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 4;
`;

const LightbulbBulb = styled.View`
  width: 40px;
  height: 40px;
  background-color: #FEF3C7;
  border-radius: 20px;
  position: absolute;
  top: 0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
  elevation: 3;
`;

const LightbulbGlow = styled.View`
  width: 60px;
  height: 60px;
  background-color: rgba(254, 243, 199, 0.3);
  border-radius: 30px;
  position: absolute;
  top: -10px;
  left: -10px;
`;

const ChartCenterText3D = styled.View`
  position: absolute;
  top: 50%;
  left: 50%;
  align-items: center;
  z-index: 15;
  width: 140px;
`;

const ChartMainText3D = styled.Text`
  font-size: ${fontSize.sm}px;
  color: ${colors.text};
  font-weight: 600;
  margin-bottom: ${spacing.xs}px;
  text-align: center;
`;

const RiskIndicator3D = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(20, 20, 35, 0.8);
  padding: ${spacing.xs}px ${spacing.sm}px;
  border-radius: ${borderRadius.sm}px;
  border-width: 1px;
  border-color: rgba(167, 139, 250, 0.2);
`;

const RiskDot3D = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  margin-right: ${spacing.sm}px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.2;
  shadow-radius: 2px;
  elevation: 2;
`;

const RiskText3D = styled.Text`
  font-size: ${fontSize.md}px;
  font-weight: 600;
`;

const LegendContainer3D = styled.View`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  margin-top: ${spacing.md}px;
`;

const LegendItem3D = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(20, 20, 35, 0.6);
  padding: ${spacing.xs}px ${spacing.sm}px;
  border-radius: ${borderRadius.sm}px;
  border-width: 1px;
  border-color: rgba(167, 139, 250, 0.1);
`;

const LegendDot3D = styled.View`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  margin-right: ${spacing.sm}px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.2;
  shadow-radius: 2px;
  elevation: 2;
`;

const LegendText3D = styled.Text`
  font-size: ${fontSize.sm}px;
  color: ${colors.textSecondary};
  font-weight: 500;
`;

// 기존 차트 스타일 (호환성을 위해 유지)
const ChartBackground = styled.View`
  width: 200px;
  height: 200px;
  border-radius: 100px;
  background-color: rgba(20, 20, 35, 0.8);
  position: relative;
  overflow: hidden;
  margin-bottom: ${spacing.md}px;
`;

const ChartSection = styled.View`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 120px;
  opacity: 0.8;
`;

const ChartCenterCircle = styled.View`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: rgba(20, 20, 35, 0.9);
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: rgba(167, 139, 250, 0.2);
`;

const RiskText = styled.Text`
  font-size: ${fontSize.md}px;
  font-weight: 600;
`;

// New styles for chat and drawing containers
const ChatWindowContainer = styled.View`
  height: 200px;
  background-color: rgba(20, 20, 35, 0.5);
  border-radius: ${borderRadius.md}px;
  border-width: 1px;
  border-color: rgba(167, 139, 250, 0.1);
  overflow: hidden;
`;

const AnalysisContainer = styled.ScrollView`
  height: 200px;
  background-color: rgba(20, 20, 35, 0.5);
  border-radius: ${borderRadius.md}px;
  padding: ${spacing.md}px;
  border-width: 1px;
  border-color: rgba(167, 139, 250, 0.1);
`;

// 그림 검사용 세로 배치 스타일
const DrawingExamContent = styled.View`
  flex-direction: column;
  gap: ${spacing.lg}px;
`;

const DrawingExamSection = styled.View`
  background-color: rgba(20, 20, 35, 0.3);
  padding: ${spacing.md}px;
  border-radius: ${borderRadius.md}px;
`;

// 임시 스타일 객체 (lightbulb 이미지용)
const styles = {
  lightbulbImage: {
    width: 40,
    height: 40,
  },
};

// 새로운 3D 위험도 표시 컴포넌트 스타일
const FinalRiskContainer = styled.View`
  align-items: center;
  margin-top: ${spacing.lg}px;
  margin-bottom: ${spacing.xl}px;
`;

const FinalRiskBackground = styled.View`
  width: 250px;
  height: 250px;
  border-radius: 125px;
  background-color: rgba(20, 20, 35, 0.9);
  position: relative;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 16px;
  elevation: 12;
`;

const FinalRiskBackgroundLayer1 = styled.View`
  position: absolute;
  top: -50px;
  left: -50px;
  width: 300px;
  height: 300px;
  border-radius: 150px;
  background-color: rgba(255, 255, 255, 0.05);
  transform: rotate(45deg);
  opacity: 0.5;
  z-index: -1;
`;

const FinalRiskBackgroundLayer2 = styled.View`
  position: absolute;
  top: 50px;
  right: -50px;
  width: 300px;
  height: 300px;
  border-radius: 150px;
  background-color: rgba(255, 255, 255, 0.03);
  transform: rotate(-45deg);
  opacity: 0.3;
  z-index: -1;
`;

const FinalRiskBackgroundLayer3 = styled.View`
  position: absolute;
  bottom: -50px;
  left: 50px;
  width: 300px;
  height: 300px;
  border-radius: 150px;
  background-color: rgba(255, 255, 255, 0.07);
  transform: rotate(90deg);
  opacity: 0.4;
  z-index: -1;
`;

const FinalRiskMain = styled.View`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 180px;
  height: 180px;
  border-radius: 90px;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  border-width: 2px;
  border-color: rgba(167, 139, 250, 0.3);
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 8px;
  elevation: 6;
`;

const FinalRiskCircle = styled.View`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-width: 2px;
  border-color: rgba(167, 139, 250, 0.5);
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
  elevation: 4;
`;

const FinalRiskInnerCircle = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.3);
  border-width: 1px;
  border-color: rgba(167, 139, 250, 0.7);
`;

const FinalRiskText = styled.Text`
  font-size: ${fontSize.xxl}px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.5);
`;

const FinalRiskSubtitle = styled.Text`
  font-size: ${fontSize.md}px;
  color: ${colors.textSecondary};
  text-align: center;
  margin-top: ${spacing.sm}px;
  font-style: italic;
`;

const FinalRiskDescription = styled.Text`
  font-size: ${fontSize.sm}px;
  color: ${colors.textSecondary};
  text-align: center;
  margin-top: ${spacing.xs}px;
  line-height: ${fontSize.sm * 1.4}px;
`;

// 전구 이미지 관련 스타일
const LightbulbImageContainer = styled.View`
  position: absolute;
  top: 47%;
  left: 53%;
  width: 120px;
  height: 120px;
  justify-content: center;
  align-items: center;
  z-index: 5;
`;

const LightbulbImage = styled.Image`
  width: 120px;
  height: 120px;
  shadow-color: #000;
  shadow-offset: 0px 6px;
  shadow-opacity: 0.4;
  shadow-radius: 12px;
  elevation: 8;
`;

const ComprehensiveResultContainer = styled.View`
  align-items: center;
  margin-bottom: 2px;
`;

const ComprehensiveResultText = styled.Text`
  font-size: ${fontSize.lg}px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: ${spacing.sm}px;
  text-align: center;
`;

const ComprehensiveResultIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(20, 20, 35, 0.8);
  padding: ${spacing.xs}px ${spacing.sm}px;
  border-radius: ${borderRadius.sm}px;
  border-width: 1px;
  border-color: rgba(167, 139, 250, 0.2);
`;

const ComprehensiveResultDot = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  margin-right: ${spacing.sm}px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.2;
  shadow-radius: 2px;
  elevation: 2;
`;

const ComprehensiveResultStatus = styled.Text`
  font-size: ${fontSize.md}px;
  font-weight: 600;
`;
