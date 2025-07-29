import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius, commonStyles } from '../AppStyle';
import { useReportIdStore } from '../store/reportIdStore';
import { useReportStore } from '../store/reportStore';
import { useReportHistoryStore } from '../store/reportHistoryStore';
import { getReportResult, getChatLogs, finalizeReport, getBaseURL } from '../api';
import type { ChatLogResponse } from '@shared/types/api';
import type { ReportResponse } from '../store/reportStore';

// lightbulb 이미지 에셋들 - require 사용
const lightbulbIcon = require('../assets/imgs/lightbulb.png');
const lightbulbBlueIcon = require('../assets/imgs/lightbulb-blue.png');
const lightbulbRedIcon = require('../assets/imgs/lightbulb-red.png');

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



// AD8 진행바 컴포넌트 추가
const AD8ProgressBar: React.FC<{ score: number; maxScore: number }> = ({ score, maxScore }) => {
  const progress = Math.min(score / maxScore, 1);
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${progress * 100}%`,
              backgroundColor: score <= 2 ? '#18A092' : score <= 4 ? '#F7D46E' : '#EE0000'
            }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>{score} / {maxScore}</Text>
    </View>
  );
};

// 간단한 원형 차트 컴포넌트
const SimplePieChart: React.FC<{
  data: Array<{ name: string; value: number; status: '양호' | '경계' | '위험' }>;
  finalRisk: '양호' | '경계' | '위험';
}> = ({ data, finalRisk }) => {
  // finalRisk에 따른 lightbulb 이미지 선택
  const getLightbulbIcon = () => {
    if (finalRisk === '양호') return lightbulbBlueIcon;
    if (finalRisk === '위험') return lightbulbRedIcon;
    return lightbulbIcon;
  };

  // 각 검사 결과에 따른 색상 결정
  const getChartColor = (status: '양호' | '경계' | '위험') => {
    switch (status) {
      case '양호': return '#18A092';
      case '경계': return '#F7D46E';
      case '위험': return '#EE0000';
      default: return '#F7D46E';
    }
  };

  return (
    <View style={styles.chartContainer}>
      {/* 차트 배경 */}
      <View style={styles.chartBackground}>
        {/* 각 검사 결과를 원형으로 표현 */}
        {data.map((item, index) => (
          <View 
            key={index}
            style={[
              styles.chartSection, 
              { 
                backgroundColor: getChartColor(item.status),
                transform: [{ rotate: `${index * 120}deg` }],
                opacity: item.value > 0 ? 0.8 : 0.1
              }
            ]} 
          />
        ))}
        
        {/* 중앙 원 */}
        <View style={styles.chartCenterCircle}>
          <Image 
            source={getLightbulbIcon()} 
            style={styles.lightbulbImage}
            resizeMode="contain"
          />
        </View>
      </View>
      
      {/* 중앙 텍스트 오버레이 */}
      <View style={styles.chartCenterText}>
        <Text style={styles.chartMainText}>종합 인지 결과</Text>
        <View style={styles.riskIndicator}>
          <View style={[styles.riskDot, { backgroundColor: getStatusColor(finalRisk) }]} />
          <Text style={[styles.riskText, { color: getStatusColor(finalRisk) }]}>
            {finalRisk}
          </Text>
        </View>
      </View>
      
      {/* 범례 */}
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getChartColor(item.status) }]} />
            <Text style={styles.legendText}>{item.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// 검사 결과 카드 컴포넌트
const ExamCard: React.FC<{
  title: string;
  status: '양호' | '경계' | '위험';
  children: React.ReactNode;
}> = ({ title, status, children }) => (
  <View style={[styles.examCard, { borderColor: getStatusColor(status) + '20' }]}>
    <View style={styles.examCardHeader}>
      <Text style={styles.examCardTitle}>{title}</Text>
      <View style={[styles.statusBadge, { backgroundColor: getStatusBackgroundColor(status) }]}>
        <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{status}</Text>
      </View>
    </View>
    {children}
  </View>
);

// 채팅 메시지 컴포넌트
const ChatMessage: React.FC<{ message: string; isUser: boolean }> = ({ message, isUser }) => (
  <View style={[styles.chatMessage, isUser ? styles.userMessage : styles.aiMessage]}>
    <Text style={styles.chatMessageText}>{message}</Text>
  </View>
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
        console.log('현재 리포트 상태:', currentReportData);
        
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
        console.log('채팅 로그 요청 시작, reportId:', reportId);
        const chatLogsData = await getChatLogs(Number(reportId));
        console.log('채팅 로그 데이터:', chatLogsData);
        console.log('채팅 로그 타입:', typeof chatLogsData);
        console.log('채팅 로그 길이:', chatLogsData ? chatLogsData.length : 'null');
        setChatLogs(chatLogsData || []);
        
        // 6. 그림 URL 확인
        console.log('그림 URL:', reportData.drawing_image_url);
        console.log('그림 URL 타입:', typeof reportData.drawing_image_url);
        console.log('그림 URL 길이:', reportData.drawing_image_url ? reportData.drawing_image_url.length : 0);
        console.log('그림 URL이 http로 시작하는가:', reportData.drawing_image_url ? reportData.drawing_image_url.startsWith('http') : false);
        
      } catch (err) {
        console.error('리포트 데이터 로딩 실패:', err);
        console.error('에러 타입:', typeof err);
        console.error('에러 메시지:', err instanceof Error ? err.message : err);
        setError(`리포트를 불러오는 데 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [reportId]);

  // 웹 환경에서 스크롤바 스타일 적용
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(20, 20, 35, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #C4B5FD, #A78BFA);
          border-radius: 4px;
          border: 1px solid rgba(167, 139, 250, 0.2);
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #A78BFA, #8B5CF6);
        }
        ::-webkit-scrollbar-corner {
          background: rgba(20, 20, 35, 0.3);
        }
      `;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, []);

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>리포트를 생성하고 있습니다...</Text>
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "리포트 데이터가 없습니다."}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={handleBackToMain}>
          <Text style={styles.errorButtonText}>메인으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 차트 데이터 준비 - 실제 결과에 맞게 수정
  const chartData = [
    { name: '그림 검사', value: 1, status: (report.drawing_risk || '경계') as '양호' | '경계' | '위험' },
    { name: '대화 검사', value: 1, status: (report.chat_risk || '경계') as '양호' | '경계' | '위험' },
    { name: '설문 검사', value: 1, status: (report.ad8_risk || '경계') as '양호' | '경계' | '위험' },
  ] as Array<{ name: string; value: number; status: '양호' | '경계' | '위험' }>;

  // 각 검사 결과에 따라 차트 비율 조정
  const totalTests = 3;
  let 양호Count = 0;
  let 경계Count = 0;
  let 위험Count = 0;

  if (report.ad8_risk === '양호') 양호Count++;
  if (report.chat_risk === '양호') 양호Count++;
  if (report.drawing_risk === '양호') 양호Count++;

  if (report.ad8_risk === '경계') 경계Count++;
  if (report.chat_risk === '경계') 경계Count++;
  if (report.drawing_risk === '경계') 경계Count++;

  if (report.ad8_risk === '위험') 위험Count++;
  if (report.chat_risk === '위험') 위험Count++;
  if (report.drawing_risk === '위험') 위험Count++;

  // 차트 데이터를 실제 결과에 맞게 조정
  chartData[0].value = 위험Count > 0 ? 1 : 0;
  chartData[1].value = 경계Count > 0 ? 1 : 0;
  chartData[2].value = 양호Count > 0 ? 1 : 0;

  const finalRisk = (report.final_risk || '경계') as '양호' | '경계' | '위험';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            
            <Text style={styles.title}>최종 분석 리포트</Text>
          </View>

          {/* 종합 결과 차트 */}
          <SimplePieChart data={chartData} finalRisk={finalRisk} />

          {/* 종합 인지 기능 평가 결과 */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>종합 인지 기능 평가 결과</Text>
            <Text style={styles.summaryText}>
              {report.final_result || '종합 인지 결과가 없습니다.'}
            </Text>
          </View>

          {/* 검사별 결과 */}
          <Text style={styles.sectionTitle}>검사별 결과 및 해석</Text>

          {/* AD8 설문 검사 */}
          <ExamCard title="설문 검사 (AD-8)" status={(report.ad8_risk || '경계') as '양호' | '경계' | '위험'}>
            <View style={styles.examContent}>
              <View style={styles.examCol}>
                <Text style={styles.examLabel}>결과 요약</Text>
                <AD8ProgressBar score={report.ad8_score} maxScore={8} />
              </View>
              <View style={styles.examCol}>
                <Text style={styles.examLabel}>분석 및 제안</Text>
                <Text style={styles.examSuggestion}>{report.ad8test_result}</Text>
              </View>
            </View>
          </ExamCard>

          {/* 대화 검사 */}
          <ExamCard title="대화 검사" status={(report.chat_risk || '경계') as '양호' | '경계' | '위험'}>
            <View style={styles.examContent}>
              <View style={styles.examCol}>
                <Text style={styles.examLabel}>대화 내용</Text>
                <View style={styles.chatWindowContainer}>
                  <ScrollView 
                    style={styles.chatWindow} 
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {(() => {
                      console.log('채팅 로그 렌더링:', chatLogs);
                      return null;
                    })()}
                    {chatLogs && chatLogs.length > 0 ? (
                      chatLogs
                        .filter(item => item.role === 'user' || item.role === 'ai')
                        .map((item, index) => {
                          console.log('채팅 아이템:', item);
                          return (
                            <ChatMessage
                              key={index}
                              message={item.message}
                              isUser={item.role === 'user'}
                            />
                          );
                        })
                    ) : (
                      <View style={styles.noChatContainer}>
                        <Text style={styles.noChatText}>대화 기록을 불러올 수 없습니다.</Text>
                        <Text style={styles.noChatSubText}>
                          채팅 로그 개수: {chatLogs ? chatLogs.length : 0}
                        </Text>
                        <Text style={styles.noChatSubText}>채팅 검사가 완료되지 않았거나 기록이 없습니다.</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </View>
              <View style={styles.examCol}>
                <Text style={styles.examLabel}>분석 및 제안</Text>
                <ScrollView 
                  style={styles.analysisContainer}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  <Text style={styles.examSuggestion}>{report.chat_result}</Text>
                </ScrollView>
              </View>
            </View>
          </ExamCard>

          {/* 그림 검사 */}
          {report.drawing_image_url && (
            <ExamCard title="그림 검사" status={(report.drawing_risk || '경계') as '양호' | '경계' | '위험'}>
              <View style={styles.examContent}>
                <View style={styles.examCol}>
                  <Text style={styles.examLabel}>그림 결과</Text>
                  <View style={styles.drawingContainer}>
                    <Image
                      source={{
                        uri: report.presigned_url || report.drawing_image_url,
                        headers: {
                          'Accept': 'image/*',
                          'User-Agent': 'ReactNative',
                        },
                        cache: 'reload'
                      }}
                      style={styles.drawingImage}
                      resizeMode="contain"
                      onError={(error) => {
                        console.log('그림 로딩 에러:', error);
                        console.log('그림 URL:', report.drawing_image_url);
                        console.log('Presigned URL:', report.presigned_url);
                      }}
                      onLoad={() => {
                        console.log('그림 로딩 성공:', report.presigned_url || report.drawing_image_url);
                      }}
                    />
                  </View>
                </View>
                <View style={styles.examCol}>
                  <Text style={styles.examLabel}>분석 및 제안</Text>
                  <ScrollView 
                    style={styles.analysisContainer}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <Text style={styles.examSuggestion}>
                      {report.drawingtest_result || '그림 검사 결과가 없습니다.'}
                    </Text>
                  </ScrollView>
                </View>
              </View>
            </ExamCard>
          )}

          {/* 액션 버튼 */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleBackToMain}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>다시하기</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  
  loadingText: {
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  
  errorText: {
    fontSize: fontSize.lg,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  
  errorButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.round,
  },
  
  errorButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  
  scrollView: {
    flex: 1,
  },
  
  content: {
    padding: spacing.md,
    paddingTop: spacing.xxl,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  backButtonText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '600',
  },
  
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: '#C4B5FD',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
    height: 300,
  },
  
  chartCenterText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    zIndex: 10,
    width: 120,
  },
  
  chartMainText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.md,
  },
  
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  
  legendText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },
  
  summaryTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  
  summaryText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: fontSize.md * 1.6,
    textAlign: 'center',
  },
  
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#C4B5FD',
    marginBottom: spacing.lg,
    textAlign: 'left',
  },
  
  examCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  examCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167, 139, 250, 0.1)',
  },
  
  examCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#5EEAD4',
  },
  
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  
  examContent: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  
  examCol: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 35, 0.3)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  
  examLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  
  examSuggestion: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: fontSize.md * 1.6,
  },
  
  // AD8 진행바 스타일
  progressContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  
  progressBackground: {
    width: '100%',
    height: 20,
    backgroundColor: 'rgba(20, 20, 35, 0.5)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  
  progressText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  
  chatWindow: {
    flex: 1,
    padding: spacing.md,
  },
  
  chatMessage: {
    maxWidth: '80%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  
  userMessage: {
    backgroundColor: '#8B5CF6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: borderRadius.sm,
  },
  
  aiMessage: {
    backgroundColor: '#374151',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: borderRadius.sm,
  },
  
  chatMessageText: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
  },
  
  noChatText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: fontSize.md,
  },
  
  noChatSubText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  
  noChatContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
    backgroundColor: 'rgba(20, 20, 35, 0.3)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },
  
  drawingImage: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    shadowColor: '#a78bfa',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  
  drawingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 220,
    backgroundColor: 'rgba(20, 20, 35, 0.2)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
    padding: spacing.md,
  },
  
  noDrawingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
    backgroundColor: 'rgba(20, 20, 35, 0.3)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },
  
  noDrawingText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  
  actionContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  
  // 차트 관련 스타일
  chartBackground: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(20, 20, 35, 0.8)',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  
  chartSection: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 120,
    opacity: 0.8,
  },
  
  chartCenterCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(20, 20, 35, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  
  lightbulbImage: {
    width: 40,
    height: 40,
  },
  
  riskText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  
  // New styles for chat and drawing containers
  chatWindowContainer: {
    height: 200,
    backgroundColor: 'rgba(20, 20, 35, 0.5)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
    overflow: 'hidden',
  },

  analysisContainer: {
    height: 200,
    backgroundColor: 'rgba(20, 20, 35, 0.5)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },

  drawingScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  
 
});

