import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  PanResponder,
  useWindowDimensions,
  Platform,
} from 'react-native';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius, shadows } from '../AppStyle';
import { useReportIdStore } from '../store/reportIdStore';
import { uploadDrawingTest } from '../api';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import BottomBar from '../components/BottomBar'
import AppHeader from '../components/AppHeader';

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

  const { width: windowWidth } = useWindowDimensions();
  const canvasSize = Math.max(320, Math.min(400, windowWidth * 0.85));

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
        // 모바일 환경에서는 ViewShot 사용
        console.log("모바일 환경에서 ViewShot 사용 중...");
        
        const canvasViewRef = canvasRef.current;
        if (!canvasViewRef) {
          throw new Error("캔버스를 찾을 수 없습니다.");
        }

        // ViewShot을 사용하여 캔버스를 이미지로 캡처
        const uri = await captureRef(canvasViewRef, {
          format: 'png',
          quality: 0.8,
        });

        console.log("ViewShot 캡처 완료:", uri);

        // URI를 File로 변환
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], 'drawing.png', { type: 'image/png' });
        
        console.log("모바일 File 생성 완료:", file.name, file.size, 'bytes');
        await uploadDrawingTest(reportId, file);
        console.log("모바일 업로드 성공!");
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
    <Container>
      {/* 그라데이션 배경 */}
      <BackgroundGradient />
      
      <Content
        style={[
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* 상단 헤더 */}
        <AppHeader />
        
        <MainContent>
          {/* 그림 검사 제목과 지시문 */}
          <TitleSection>
            <Title>그림 검사</Title>
            <Subtitle>
              주어진 시계판 위에 <Highlight>11시 10분</Highlight>을 그려주세요
            </Subtitle>
          </TitleSection>

          {/* 캔버스 섹션 */}
          <CanvasSection>
            <CanvasWrapper style={{ width: canvasSize, height: canvasSize }}>
              {Platform.OS === 'web' ? (
                  <canvas
                  ref={canvasRef}
                  width={canvasSize}
                  height={canvasSize}
                  style={{
                    width: canvasSize,
                    height: canvasSize,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    borderRadius: 20,
                    border: '2px solid rgba(127, 206, 187, 0.3)',
                    cursor: 'crosshair',
                    display: 'block',
                    touchAction: 'none',
                    userSelect: 'none',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
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
                <MobileNotSupported>
                  <Svg width={48} height={48} fill="none" stroke="#7fcebb" viewBox="0 0 24 24">
                    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </Svg>
                  <MobileNotSupportedText>
                    모바일 환경에서는 아직 지원되지 않습니다
                  </MobileNotSupportedText>
                </MobileNotSupported>
              )}
            </CanvasWrapper>
          </CanvasSection>

                   {/* 컨트롤 버튼들 */}
           <Controls style={{ width: canvasSize }}>
             <ClearButton
               onPress={handleClear}
               disabled={isSubmitting}
               activeOpacity={0.8}
             >
               <ClearButtonText>모두 지우기</ClearButtonText>
             </ClearButton>
             
             <SubmitButton
               onPress={handleSubmit}
               disabled={isSubmitting}
               activeOpacity={0.8}
             >
               <SubmitButtonText>
                 {isSubmitting ? "제출 중..." : "제출하기"}
               </SubmitButtonText>
             </SubmitButton>
           </Controls>
        </MainContent>
      </Content>

      {/* 하단바 */}
      <BottomBar currentPage="Drawing" />
    </Container>
  );
}

// Styled Components
const Container = styled.View`
  flex: 1;
  background: #0f172a;
`;

const BackgroundGradient = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #0f172a;
`;

const Content = styled(Animated.View)`
  flex: 1;
  justify-content: center;
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 24px;
  padding-bottom: 16px;
`;

const MainContent = styled.View`
`;

const TitleSection = styled.View`
  align-items: center;
  margin-top: 24px;
  margin-bottom: 16px;
`;

const Title = styled.Text`
  font-size: 33px;
  font-weight: 700;
  color: #19B0CA;
  margin-bottom: 8px;
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: #19B0CA;
  font-weight: 500;
  line-height: 20px;
`;

const Highlight = styled.Text`
  color: #ffffff;
  font-weight: 700;
  font-size: 18px;
`;

const CanvasSection = styled.View`
  align-items: center;
  margin-bottom: 16px;
`;

const CanvasWrapper = styled.View`
  background: #222433;
  border-radius: 18px;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
`;

const Controls = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  align-self: center;
  margin-top: 1px;
  width: 100%;
`;

const ClearButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #505664;
  border-radius: 30px;
  padding: 8px 20px;
`;

const ClearButtonText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
`;

const SubmitButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #19B0CA;
  border-radius: 30px;
  padding: 8px 20px;
`;

const SubmitButtonText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #fff;
`;

const MobileNotSupported = styled.View`
  width: 326px;
  height: 326px;
  background-color: rgba(15, 23, 42, 0.8);
  border-radius: 16px;
  border-width: 2px;
  border-color: rgba(127, 206, 187, 0.3);
  justify-content: center;
  align-items: center;
  elevation: 8;
`;

const MobileNotSupportedText = styled.Text`
  font-size: 18px;
  color: #7fcebb;
  text-align: center;
  margin-top: 16px;
  padding-left: 20px;
  padding-right: 20px;
`;