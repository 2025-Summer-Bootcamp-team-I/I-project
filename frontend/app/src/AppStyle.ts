import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 화면 크기별 브레이크포인트
export const breakpoints = {
  small: 375,
  medium: 768,
  large: 1024,
};

// 현재 화면 크기 확인
export const isSmallScreen = screenWidth < breakpoints.small;
export const isTablet = screenWidth >= breakpoints.medium;
export const isLargeScreen = screenWidth >= breakpoints.large;

// 앱 전용 색상 팔레트
export const colors = {
  // 메인 색상
  primary: '#6a0dad',      // 보라색 (뇌 테마)
  secondary: '#0077ff',    // 파란색
  accent: '#00d4ff',       // 하늘색
  
  // 배경 색상
  background: '#0c0a1a',   // 어두운 배경
  surface: '#1a1a2e',      // 카드 배경
  card: '#16213e',         // 카드 배경 2
  
  // 텍스트 색상
  text: '#ffffff',         // 흰색 텍스트
  textSecondary: '#b0b0b0', // 회색 텍스트
  textMuted: '#666666',    // 어두운 회색 텍스트
  
  // 상태 색상
  success: '#4caf50',      // 성공
  warning: '#ff9800',      // 경고
  error: '#f44336',        // 에러
  info: '#2196f3',         // 정보
  
  // 그라데이션 색상
  gradientStart: '#6a0dad',
  gradientEnd: '#0077ff',
  
  // 투명도
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // 플랫폼별 색상
  ...(Platform.OS === 'ios' && {
    // iOS 전용 색상
    iosBackground: '#f2f2f7',
    iosCard: '#ffffff',
  }),
  ...(Platform.OS === 'android' && {
    // Android 전용 색상
    androidBackground: '#fafafa',
    androidCard: '#ffffff',
  }),
};

// 반응형 여백
export const spacing = {
  xs: isSmallScreen ? 2 : 4,
  sm: isSmallScreen ? 6 : 8,
  md: isSmallScreen ? 12 : 16,
  lg: isSmallScreen ? 18 : 24,
  xl: isSmallScreen ? 24 : 32,
  xxl: isSmallScreen ? 36 : 48,
  xxxl: isSmallScreen ? 48 : 64,
};

// 반응형 폰트 크기
export const fontSize = {
  xs: isSmallScreen ? 10 : 12,
  sm: isSmallScreen ? 12 : 14,
  md: isSmallScreen ? 14 : 16,
  lg: isSmallScreen ? 16 : 18,
  xl: isSmallScreen ? 18 : 20,
  xxl: isSmallScreen ? 20 : 24,
  xxxl: isSmallScreen ? 24 : 32,
  title: isSmallScreen ? 22 : 28,
  subtitle: isSmallScreen ? 18 : 22,
  // 태블릿용 큰 폰트
  ...(isTablet && {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
    xl: 22,
    xxl: 26,
    xxxl: 36,
    title: 32,
    subtitle: 26,
  }),
};

// 반응형 둥근 모서리
export const borderRadius = {
  sm: isSmallScreen ? 6 : 8,
  md: isSmallScreen ? 8 : 12,
  lg: isSmallScreen ? 12 : 16,
  xl: isSmallScreen ? 16 : 20,
  round: 999,
};

// 플랫폼별 그림자
export const shadows = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
};

// 공통 스타일
export const commonStyles = StyleSheet.create({
  // 컨테이너
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // 카드 스타일
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    margin: spacing.sm,
    ...shadows.medium,
  },
  
  // 버튼 스타일
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
    // 터치 피드백 최적화
    ...(Platform.OS === 'android' && {
      android_ripple: { color: 'rgba(255, 255, 255, 0.2)' },
    }),
  },
  
  buttonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // 입력 필드 스타일
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.textMuted,
    ...(Platform.OS === 'ios' && {
      paddingVertical: spacing.sm,
    }),
  },
  
  // 텍스트 스타일
  title: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    ...(Platform.OS === 'ios' && {
      fontFamily: 'System',
    }),
    ...(Platform.OS === 'android' && {
      fontFamily: 'sans-serif-medium',
    }),
  },
  
  subtitle: {
    fontSize: fontSize.subtitle,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    ...(Platform.OS === 'ios' && {
      fontFamily: 'System',
    }),
    ...(Platform.OS === 'android' && {
      fontFamily: 'sans-serif',
    }),
  },
  
  bodyText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: fontSize.md * 1.5,
    ...(Platform.OS === 'ios' && {
      fontFamily: 'System',
    }),
    ...(Platform.OS === 'android' && {
      fontFamily: 'sans-serif',
    }),
  },
  
  // 센터 정렬
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 행 정렬
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // 공간 분배
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  // 그라데이션 배경 (LinearGradient 사용 시)
  gradientBackground: {
    flex: 1,
  },
  
  // 안전 영역 고려
  safeArea: {
    flex: 1,
    ...(Platform.OS === 'ios' && {
      paddingTop: 44, // iPhone 노치 고려
    }),
    ...(Platform.OS === 'android' && {
      paddingTop: 24, // Android 상태바 고려
    }),
  },
  
  // 스크롤뷰 최적화
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'ios' && {
      showsVerticalScrollIndicator: false,
    }),
  },
  
  // 터치 영역 최적화 (최소 44px)
  touchableArea: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// 앱 전용 애니메이션 값들
export const animations = {
  // 페이드인
  fadeIn: {
    opacity: [0, 1],
    duration: 500,
    useNativeDriver: true,
  },
  
  // 슬라이드업
  slideUp: {
    transform: [{ translateY: [50, 0] }],
    opacity: [0, 1],
    duration: 600,
    useNativeDriver: true,
  },
  
  // 스케일
  scale: {
    transform: [{ scale: [0.8, 1] }],
    opacity: [0, 1],
    duration: 400,
    useNativeDriver: true,
  },
  
  // 버튼 프레스
  buttonPress: {
    transform: [{ scale: [1, 0.95] }],
    duration: 100,
    useNativeDriver: true,
  },
  
  // 카드 슬라이드
  cardSlide: {
    transform: [{ translateX: [screenWidth, 0] }],
    opacity: [0, 1],
    duration: 300,
    useNativeDriver: true,
  },
};

// 반응형 유틸리티 함수들
export const responsiveUtils = {
  // 화면 너비의 퍼센트
  width: (percent: number) => (screenWidth * percent) / 100,
  
  // 화면 높이의 퍼센트
  height: (percent: number) => (screenHeight * percent) / 100,
  
  // 반응형 폰트 크기
  fontSize: (size: number) => {
    if (isSmallScreen) return size * 0.8;
    if (isTablet) return size * 1.2;
    return size;
  },
  
  // 반응형 패딩
  padding: (size: keyof typeof spacing) => {
    if (isSmallScreen) return spacing[size] * 0.8;
    if (isTablet) return spacing[size] * 1.2;
    return spacing[size];
  },
};

export default {
  colors,
  spacing,
  fontSize,
  borderRadius,
  shadows,
  commonStyles,
  animations,
  responsiveUtils,
  breakpoints,
  isSmallScreen,
  isTablet,
  isLargeScreen,
}; 