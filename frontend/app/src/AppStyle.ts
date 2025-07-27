import { StyleSheet } from 'react-native';

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
};

// 앱 전용 여백
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// 앱 전용 폰트 크기
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  title: 28,
  subtitle: 22,
};

// 앱 전용 둥근 모서리
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 999,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // 버튼 스타일
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  buttonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
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
  },
  
  // 텍스트 스타일
  title: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: fontSize.subtitle,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  bodyText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
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
});

// 앱 전용 애니메이션 값들
export const animations = {
  // 페이드인
  fadeIn: {
    opacity: [0, 1],
    duration: 500,
  },
  
  // 슬라이드업
  slideUp: {
    transform: [{ translateY: [50, 0] }],
    opacity: [0, 1],
    duration: 600,
  },
  
  // 스케일
  scale: {
    transform: [{ scale: [0.8, 1] }],
    opacity: [0, 1],
    duration: 400,
  },
  
  // 버튼 프레스
  buttonPress: {
    transform: [{ scale: [1, 0.95] }],
    duration: 100,
  },
};

export default {
  colors,
  spacing,
  fontSize,
  borderRadius,
  commonStyles,
  animations,
}; 