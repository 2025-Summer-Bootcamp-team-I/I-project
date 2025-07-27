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
import Svg, { Path, Circle } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';

type DrawingPageNavigationProp = StackNavigationProp<RootStackParamList, 'Drawing'>;

interface Point {
  x: number;
  y: number;
}

interface DrawingLine {
  points: Point[];
  color: string;
  width: number;
}

export default function DrawingPage() {
  const navigation = useNavigation<DrawingPageNavigationProp>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<Point | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawingLines, setDrawingLines] = useState<DrawingLine[]>([]);
  const [currentLine, setCurrentLine] = useState<DrawingLine | null>(null);
  
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
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;
  const clockRadius = canvasSize * 0.35;

  // 시계판 그리기 (초기화)
  const drawClockFace = () => {
    setDrawingLines([]);
    setCurrentLine(null);
  };

  useEffect(() => {
    drawClockFace();
  }, []);

  const handleStart = (x: number, y: number) => {
    setIsDrawing(true);
    setLastPos({ x, y });
    const newLine: DrawingLine = {
      points: [{ x, y }],
      color: "#FFFFFF",
      width: 3,
    };
    setCurrentLine(newLine);
  };

  const handleMove = (x: number, y: number) => {
    if (!isDrawing || !lastPos || !currentLine) return;
    
    const updatedLine = {
      ...currentLine,
      points: [...currentLine.points, { x, y }],
    };
    setCurrentLine(updatedLine);
    setLastPos({ x, y });
  };

  const handleEnd = () => {
    if (currentLine) {
      setDrawingLines([...drawingLines, currentLine]);
      setCurrentLine(null);
    }
    setIsDrawing(false);
    setLastPos(null);
  };

  const handleClear = () => {
    drawClockFace();
  };

  const canvasRef = useRef<ViewShot>(null);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!reportId) {
      Alert.alert("오류", "리포트 ID를 찾을 수 없습니다. AD8 검사를 먼저 진행해주세요.");
      navigation.navigate('Main' as any);
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUri: string;

      if (Platform.OS === 'web') {
        // 웹 환경에서는 SVG를 Canvas로 변환하여 이미지 생성
        console.log("웹 환경에서 SVG를 이미지로 변환 중...");
        
        // SVG 요소 찾기
        const svgElement = document.querySelector('svg');
        if (!svgElement) {
          throw new Error("SVG 요소를 찾을 수 없습니다.");
        }

        // SVG를 문자열로 변환
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);

        // Canvas 생성 및 이미지 그리기
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error("Canvas context를 생성할 수 없습니다.");
        }

        canvas.width = canvasSize;
        canvas.height = canvasSize;

        // 배경색 설정
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // SVG 이미지 로드 및 그리기
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = svgUrl;
        });

        ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
        URL.revokeObjectURL(svgUrl);

        // Canvas를 Blob으로 변환
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, 'image/png');
        });

                 // Blob을 File로 변환
         const file = new File([blob], 'drawing.png', { type: 'image/png' });
         
         // 기존 uploadDrawingTest 함수 사용 (인증 처리 포함)
         await uploadDrawingTest(reportId, file);
        imageUri = URL.createObjectURL(blob);
      } else {
        // 모바일 환경에서는 ViewShot 사용
        console.log("모바일 환경에서 ViewShot 사용 중...");
        
        if (canvasRef.current?.capture) {
          imageUri = await canvasRef.current.capture();
          
          const formData = new FormData();
          formData.append('file', {
            uri: imageUri,
            type: 'image/png',
            name: 'drawing.png',
          } as any);
          
          await uploadDrawingTest(reportId, formData);
        } else {
          throw new Error("캔버스를 찾을 수 없습니다.");
        }
      }
      
      console.log("그림 제출 성공!", imageUri);
      setDrawingCompleted(true);
      Alert.alert("성공", "그림이 성공적으로 제출되었습니다.");
      navigation.navigate('Main' as any);
    } catch (error) {
      console.error("Error uploading drawing:", error);
      Alert.alert("오류", "그림 제출 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      handleStart(locationX, locationY);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      handleMove(locationX, locationY);
    },
    onPanResponderRelease: () => {
      handleEnd();
    },
  });

  const renderDrawingLines = () => {
    const allLines = [...drawingLines];
    if (currentLine) {
      allLines.push(currentLine);
    }

    return allLines.map((line, lineIndex) => (
      <Svg key={lineIndex} width={canvasSize} height={canvasSize} style={StyleSheet.absoluteFill}>
        <Path
          d={line.points.map((point, index) => 
            index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
          ).join(' ')}
          stroke={line.color}
          strokeWidth={line.width}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ));
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
          <ViewShot ref={canvasRef} options={{ format: 'png', quality: 0.9 }}>
            <View
              style={[
                styles.canvas,
                {
                  width: canvasSize,
                  height: canvasSize,
                },
              ]}
              {...panResponder.panHandlers}
            >
              {/* 시계 외곽선 */}
              <Svg width={canvasSize} height={canvasSize} style={StyleSheet.absoluteFill}>
                <Circle
                  cx={centerX}
                  cy={centerY}
                  r={clockRadius}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={2}
                  fill="none"
                />
                <Circle
                  cx={centerX}
                  cy={centerY}
                  r={6}
                  fill="rgba(255,255,255,0.5)"
                />
              </Svg>
              
              {/* 그려진 선들 */}
              {renderDrawingLines()}
            </View>
          </ViewShot>
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
});
  