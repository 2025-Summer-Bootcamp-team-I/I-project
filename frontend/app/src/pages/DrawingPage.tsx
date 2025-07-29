import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  PanResponder,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius, shadows } from '../AppStyle';
import { useReportIdStore } from '../store/reportIdStore';
import { uploadDrawingTest } from '../api';
import Svg, { Path } from 'react-native-svg';

type DrawingPageNavigationProp = StackNavigationProp<RootStackParamList, 'Drawing'>;

interface Point {
  x: number;
  y: number;
}

export default function DrawingPage() {
  const navigation = useNavigation<DrawingPageNavigationProp>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<Point | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { reportId, setDrawingCompleted } = useReportIdStore();
  
  // 애니메이션 값들
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
  }, []);

  const canvasSize = Math.min(screenWidth * 0.8, screenHeight * 0.5);

  // 웹 환경에서 Canvas API 사용
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 시계판 그리기 (웹 버전과 동일)
  const drawClockFace = () => {
    if (Platform.OS !== 'web') return;
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ Canvas ref가 없습니다');
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Canvas context를 가져올 수 없습니다');
      return;
    }
    
    // Canvas 크기를 고정값으로 설정 (마우스 이벤트 좌표계 문제 해결)
    canvas.width = 326;
    canvas.height = 326;
    console.log('Canvas 크기 설정:', canvas.width, 'x', canvas.height);

    // 시계판만 그리기 (유저 드로잉은 지우지 않음)
    const radius = (canvas.width / 2) * 0.9;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fill();
    ctx.restore();
    console.log('✅ 시계판 그리기 완료');
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Canvas가 렌더링된 후 시계판 그리기
      setTimeout(() => {
        drawClockFace();
      }, 100);
    }
  }, []);

  // 마우스/터치 이벤트 핸들러 (웹 버전과 동일)
  const getPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Canvas 크기와 화면 크기의 비율 계산
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    console.log('🎯 Mouse position:', { clientX: e.clientX, clientY: e.clientY, rect: rect, x, y });
    
    return { x, y };
  };

  const handleStart = (e: React.MouseEvent) => {
    if (Platform.OS !== 'web') return;
    
    console.log('🎨 Drawing START');
    setIsDrawing(true);
    const pos = getPos(e);
    setLastPos(pos);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 새로운 경로 시작
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    console.log('🎨 Canvas path started at:', pos.x, pos.y);
  };

  const handleMove = (e: React.MouseEvent) => {
    if (Platform.OS !== 'web' || !isDrawing) return;
    
    const pos = getPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPos) return;
    
    // 선 그리기 설정
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    // 선 그리기
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
    console.log('🎨 Drawing line to:', pos.x, pos.y);
  };

  const handleEnd = (e: React.MouseEvent) => {
    if (Platform.OS !== 'web') return;
    console.log('🎨 Drawing END');
    setIsDrawing(false);
    setLastPos(null);
  };

  const handleClear = () => {
    if (Platform.OS === 'web') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // 캔버스 전체 지우기
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 시계판 다시 그리기
      drawClockFace();
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!reportId) {
      Alert.alert("오류", "리포트 ID를 찾을 수 없습니다. AD8 검사를 먼저 진행해주세요.");
      navigation.navigate('Main' as any);
      return;
    }

    setIsSubmitting(true);

    try {
      if (Platform.OS === 'web') {
        // 웹 환경에서는 Canvas를 직접 Blob으로 변환
        console.log("웹 환경에서 Canvas를 Blob으로 변환 중...");
        
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error("Canvas를 찾을 수 없습니다.");
        }

        // Canvas 크기 확인
        console.log('Canvas 크기:', canvas.width, 'x', canvas.height);
        console.log('Canvas 스타일 크기:', canvas.style.width, 'x', canvas.style.height);

        // Canvas를 Blob으로 변환
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              console.log('Canvas Blob 생성 성공, 크기:', blob.size, 'bytes');
              resolve(blob);
            } else {
              console.error('Canvas Blob 생성 실패');
              throw new Error("Canvas를 Blob으로 변환할 수 없습니다.");
            }
          }, 'image/png');
        });

        // Blob을 File로 변환
        const file = new File([blob], 'drawing.png', { type: 'image/png' });
        console.log('File 생성 완료:', file.name, file.size, 'bytes');
        
        console.log("Canvas Blob 생성 완료, 업로드 시작...");
        await uploadDrawingTest(reportId, file);
        console.log("업로드 성공!");
      } else {
        // 모바일 환경에서는 ViewShot 사용 (기존 로직 유지)
        console.log("모바일 환경에서 ViewShot 사용 중...");
        Alert.alert("알림", "모바일 환경에서는 아직 지원되지 않습니다.");
        return;
      }
      
      console.log("그림 제출 성공!");
      setDrawingCompleted(true);
      Alert.alert("성공", "그림이 성공적으로 제출되었습니다.");
      navigation.navigate('Main' as any);
    } catch (error) {
      console.error("Error uploading drawing:", error);
      Alert.alert("오류", `그림 제출 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      
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
            onPress={() => navigation.navigate('Main' as any)}
            activeOpacity={0.8}
          >
            <Svg width={24} height={24} fill="none" stroke="#fff" viewBox="0 0 24 24">
              <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </Svg>
          </TouchableOpacity>
          
          <Text style={styles.title}>그림 검사</Text>
          <Text style={styles.subtitle}>
            주어진 시계판 위에 <Text style={styles.highlight}>11시 10분</Text>을 그려주세요.
          </Text>
        </View>

        {/* 캔버스 */}
        <View style={styles.canvasWrapper}>
          {Platform.OS === 'web' ? (
            <canvas
              ref={canvasRef}
              style={{
                width: 326,
                height: 326,
                backgroundColor: '#0f172a',
                borderRadius: borderRadius.lg,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'crosshair',
                display: 'block',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
              }}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousedown', {
                  clientX: touch.clientX,
                  clientY: touch.clientY,
                });
                handleStart(mouseEvent as any);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                if (isDrawing) {
                  const touch = e.touches[0];
                  const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                  });
                  handleMove(mouseEvent as any);
                }
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleEnd(e as any);
              }}
            />
          ) : (
            <View style={styles.mobileNotSupported}>
              <Text style={styles.mobileNotSupportedText}>
                모바일 환경에서는 아직 지원되지 않습니다.
              </Text>
            </View>
          )}
        </View>

        {/* 컨트롤 버튼들 */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.clearButtonText}>모두 지우기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "제출 중..." : "제출하기"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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
  
  content: {
    flex: 1,
    padding: spacing.md,
    paddingTop: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  
  backButton: {
    position: 'absolute',
    top: -spacing.xl,
    left: -spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 24, 39, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 110,
  },
  
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: '#7fcebb',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  
  subtitle: {
    fontSize: fontSize.lg,
    color: '#7fcebb',
    textAlign: 'center',
  },
  
  highlight: {
    color: '#fff',
    fontWeight: '700',
    fontSize: fontSize.xl,
  },
  
  canvasWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...(Platform.OS === 'web' && {
      pointerEvents: 'auto',
    }),
  },
  
  canvas: {
    backgroundColor: '#0f172a',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.large,
  },
  
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    flexWrap: 'wrap',
    marginTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  
  clearButton: {
    backgroundColor: '#334155',
    borderRadius: borderRadius.round,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    ...shadows.medium,
  },
  
  clearButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
  
  submitButton: {
    backgroundColor: '#7fcebb',
    borderRadius: borderRadius.round,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    ...shadows.medium,
  },
  
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },

  mobileNotSupported: {
    width: 300,
    height: 300,
    backgroundColor: '#0f172a',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },

  mobileNotSupportedText: {
    fontSize: fontSize.lg,
    color: '#7fcebb',
    textAlign: 'center',
  },
});
  