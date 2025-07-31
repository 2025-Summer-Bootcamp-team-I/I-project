import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius, shadows } from '../AppStyle';
import Svg, { Path, Circle } from 'react-native-svg';
import { useReportHistoryStore } from '../store/reportHistoryStore';
import type { MyReportSummary } from '../types/api';
import Header from '../components/AppHeader';
import BottomBar from '../components/BottomBar';

type MyPageNavigationProp = StackNavigationProp<RootStackParamList, 'MyPage'>;

// 위험도에 따라 상태를 반환하는 함수
const getRiskStatus = (risk?: '양호' | '경계' | '위험' | null) => {
  if (!risk) return "unknown";
  if (risk === "위험") return "danger";
  if (risk === "경계") return "warning";
  if (risk === "양호") return "good";
  return "unknown";
};

// 전구 아이콘 컴포넌트
const LightbulbIcon = ({ color }: { color: string }) => (
  <Svg width="40" height="40" viewBox="0 0 72 72" fill="none">
    <Path d="M36 5C24.954 5 16 13.954 16 25C16 32.379 20.621 38.796 27 42.154V48C27 50.209 28.791 52 31 52H41C43.209 52 45 50.209 45 48V42.154C51.379 38.796 56 32.379 56 25C56 13.954 47.046 5 36 5Z" fill={color} fillOpacity="0.3"/>
    <Path d="M36 5C24.954 5 16 13.954 16 25C16 32.379 20.621 38.796 27 42.154V48C27 50.209 28.791 52 31 52H41C43.209 52 45 50.209 45 48V42.154C51.379 38.796 56 32.379 56 25C56 13.954 47.046 5 36 5Z" stroke={color} strokeWidth="2"/>
    <Path d="M31 58H41C42.1046 58 43 58.8954 43 60V61H29V60C29 58.8954 29.8954 58 31 58Z" fill="#4A5568"/>
    <Path d="M32 52H40V58H32V52Z" fill="#4A5568"/>
  </Svg>
);

// 각 검사 아이콘 컴포넌트
const TestIcon = ({ label, risk }: { label: string, risk?: '양호' | '경계' | '위험' | null }) => {
  const status = getRiskStatus(risk);
  const colorMap = {
    danger: '#F87171', // Red-400
    warning: '#FBBF24', // Amber-400
    good: '#6EE7B7', // Teal-300
    unknown: '#94A3B8', // Gray-400
  };
  const color = colorMap[status];

  return (
    <View style={styles.testIconContainer}>
      <LightbulbIcon color={color} />
      <Text style={styles.testIconLabel}>{label}</Text>
      {risk && <Text style={[styles.testIconRisk, { color }]}>{risk}</Text>}
    </View>
  );
};

export default function MyPage() {
  const navigation = useNavigation<MyPageNavigationProp>();
  const { myReports, isLoading, error, fetchMyReports } = useReportHistoryStore();
  
  // 화면 크기 가져오기
  const { width: screenWidth } = useWindowDimensions();
  
  // 화면 크기에 따라 카드 너비 계산
  const getCardWidth = () => {
    // 모바일에서는 기본적으로 2개씩 보여주되, 화면이 너무 작으면 1개씩
    if (screenWidth < 350) {
      return '100%'; // 매우 작은 화면에서는 한 열로
    } else {
      return undefined; // flex로 자동 계산되도록
    }
  };
  
  // 애니메이션 값들
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // 페이지 진입 애니메이션
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

    // 리포트 목록 가져오기
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
    navigation.navigate('Report', { reportId: reportId.toString() });
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.background} />
        <Header />
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>검사 기록을 불러오는 중...</Text>
        </View>
        
        <BottomBar currentPage="MyPage" />
      </View>
    );
  }

  // 에러가 있을 때
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.background} />
        <Header />
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorButtonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMyReports}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
            {error.includes('로그인') && (
              <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginButtonText}>로그인</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <BottomBar currentPage="MyPage" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      <Header />
      
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
           {/* 메인 헤더 */}
           <View style={styles.header}>
             <Text style={styles.headerTitle}>나의 검사 기록</Text>
           </View>

           {myReports.length === 0 ? (
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>아직 검사 기록이 없습니다.</Text>
               <TouchableOpacity
                 style={styles.startButton}
                 onPress={() => navigation.navigate('Main')}
                 activeOpacity={0.8}
               >
                 <Text style={styles.startButtonText}>검사 시작하기</Text>
               </TouchableOpacity>
             </View>
           ) : (
             <View style={styles.reportGrid}>
               {myReports.map((report: MyReportSummary) => {
                 const finalStatus = getRiskStatus(report.final_risk);
                 const statusText = {
                   danger: "위험",
                   warning: "경계",
                   good: "양호",
                   unknown: "미정",
                 };

                 return (
                   <TouchableOpacity
                     key={report.report_id}
                     style={[
                       styles.reportCard, 
                       { 
                         width: getCardWidth(),
                         borderColor: finalStatus === 'danger' ? '#F87171' : finalStatus === 'warning' ? '#FBBF24' : finalStatus === 'good' ? '#6EE7B7' : '#94A3B8' 
                       }
                     ]}
                     onPress={() => handleViewReport(report.report_id)}
                     activeOpacity={0.8}
                   >
                     <View style={styles.reportHeader}>
                       <Text style={styles.reportDate}>{getFormattedDate(report.created_at)}</Text>
                       <View style={styles.finalResult}>
                         <Text style={styles.finalResultLabel}>최종 결과</Text>
                         <Text style={[styles.finalResultText, { color: finalStatus === 'danger' ? '#F87171' : finalStatus === 'warning' ? '#FBBF24' : finalStatus === 'good' ? '#6EE7B7' : '#94A3B8' }]}>
                           {statusText[finalStatus]}
                         </Text>
                         {report.final_risk && (
                           <Text style={styles.finalResultDetail}>{report.final_risk}</Text>
                         )}
                       </View>
                     </View>

                     <View style={styles.testIconsContainer}>
                       <TestIcon label="AD-8 검사" risk={report.ad8_risk} />
                       <TestIcon label="대화 검사" risk={report.chat_risk} />
                       <TestIcon label="그림 검사" risk={report.drawing_risk} />
                     </View>
                     
                     <TouchableOpacity
                       style={styles.viewButton}
                       onPress={() => handleViewReport(report.report_id)}
                       activeOpacity={0.8}
                     >
                       <Text style={styles.viewButtonText}>보고서 보기</Text>
                     </TouchableOpacity>
                   </TouchableOpacity>
                 );
               })}
             </View>
           )}
         </Animated.View>
       </ScrollView>
     
       {/* 하단바 뒤에 카드들을 가리는 배경 상자 */}
       <View style={styles.bottomOverlay} />
       
       <BottomBar currentPage="MyPage" />  
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  

  
  scrollView: {
    flex: 1,
  },
  
  content: {
    padding: spacing.md,
  },
  
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  
  headerTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  
  loadingText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  
  errorText: {
    fontSize: fontSize.lg,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  
  errorButtonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  
  retryButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  
  loginButton: {
    backgroundColor: '#4299E1',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  
  loginButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(30, 30, 45, 0.5)',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  
  startButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm, // 좌우 패딩 제거 (카드에서 직접 계산)
  },
  
  reportCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.medium,
    minHeight: 200, // 최소 높이 설정
    minWidth: 140, // 최소 너비 조정
    flex: 1, // 남은 공간을 균등하게 분배
    maxWidth: '47%', // 최대 너비 제한
  },
  
  reportHeader: {
    marginBottom: spacing.md,
  },
  
  reportDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  
  finalResult: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  
  finalResultLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  
  finalResultText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  
  finalResultDetail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  
  testIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  
  testIconContainer: {
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 40,
  },
  
  testIconLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  testIconRisk: {
    fontSize: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  viewButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  
  viewButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50, // BottomBar 높이 + 여백
    backgroundColor: colors.background,
    zIndex: 0,
  },
});
