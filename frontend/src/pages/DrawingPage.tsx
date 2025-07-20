import { useReportIdStore } from "../store/reportIdStore";
import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import NeuralBackground from '../components/Background';
import Header from "../components/Header";
import { uploadDrawingTest } from '../api';
import type { ResponseItem } from '../types/api';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 6rem 2rem 2rem; /* Header height + extra space */
  box-sizing: border-box;
`;

const Inner = styled.div`
  width: 100%;
  max-width: 50rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2vh;
`;

const HeaderBox = styled.div`
  text-align: center;
  margin-bottom: 2vh;
`;

const Title = styled.h2`
  font-weight: bold;
  color: #7fcebb;
  font-size: clamp(1.8rem, 5vh, 2.5rem);
  margin: 0;
`;

const SubTitle = styled.p`
  color: #7fcebb;
  font-size: clamp(1rem, 3vh, 1.3rem);
  margin: 1vh 0 0 0;
  span {
    color: #fff;
    font-weight: bold;
    font-size: clamp(1.2rem, 3.5vh, 1.6rem);
  }
`;

const CanvasWrapper = styled.div`
  width: clamp(280px, 60vh, 90vw);
  height: clamp(280px, 60vh, 90vw);
  aspect-ratio: 1 / 1;
`;

const StyledCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  background-color: #0f172a;
  border-radius: 1rem;
  cursor: crosshair;
  display: block;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 2vh;
  padding-bottom: 3vh; /* Add padding to create space at the bottom */
`;

const Button = styled.button`
  padding: 0.7rem 1.5rem;
  border-radius: 0.7rem;
  font-weight: bold;
  font-size: clamp(0.9rem, 2vh, 1.1rem);
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  &.clear {
    background: #334155;
    color: #fff;
    &:hover {
      background: #1e293b;
    }
  }
  &.submit {
    background: #7fcebb;
    color: #fff;
    &:hover {
      background: #5bb99e;
    }
  }
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #5bb99e;
  }
  &:active:focus {
    box-shadow: 0 0 0 2px #334155;
  }
`;

const BackButton = styled.button`
  background: rgba(17, 24, 39, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  padding: 0.6rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  position: fixed;
  top: 5.5rem; /* Adjusted to be below the header */
  left: 2.5rem;
  z-index: 110; /* Ensure it's above other content */

  &:hover {
    background: rgba(17, 24, 39, 1);
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  @media (max-width: 768px) {
    top: 5rem;
    left: 1rem;
    padding: 0.5rem;
    svg {
      width: 1.2rem;
      height: 1.2rem;
    }
  }
`;

const DrawingPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // 색상, 굵기 상태 제거됨
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // 캔버스 초기화 및 시계판 그리기
  const drawClockFace = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // 캔버스 크기 동기화
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // 시계판
    const radius = (canvas.width / 2) * 0.9;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
  };

  useEffect(() => {
    drawClockFace();
    // eslint-disable-next-line
  }, []);

  // 마우스/터치 이벤트 핸들러
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    setLastPos(pos);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPos) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
    e.preventDefault();
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(false);
    setLastPos(null);
    e.preventDefault();
  };

  // 반응형: 리사이즈 시 시계판 다시 그림
  useEffect(() => {
    const handleResize = () => drawClockFace();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line
  }, []);

  // 캔버스 지우기
  const handleClear = () => {
    drawClockFace();
    // 펜 색상/굵기 다시 적용
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
  };

  // 제출
  const { reportId, setDrawingCompleted } = useReportIdStore();

  

  // 제출
  const handleSubmit = async () => {
    if (isSubmitting) return; // 이미 제출 중이면 중복 호출 방지

    if (!reportId) {
      alert("리포트 ID를 찾을 수 없습니다. AD8 검사를 먼저 진행해주세요.");
      navigate('/main');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      alert("캔버스를 찾을 수 없습니다.");
      return;
    }

    setIsSubmitting(true); // 제출 시작

    // responses 데이터 (현재는 하드코딩, 필요에 따라 동적으로 변경)
    const responses: ResponseItem[] = [{ questionNo: 1, isCorrect: true }];

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], "drawing.png", { type: "image/png" });
        try {
          await uploadDrawingTest(reportId, responses, file);
          setDrawingCompleted(true); // 그림 검사 완료 상태로 변경

          alert("그림이 성공적으로 제출되었습니다.");
          navigate('/main', { state: { cardIndex: 2 } }); // 이전 페이지로 이동
        } catch (error) {
          console.error("Error uploading drawing:", error);
          alert("그림 제출 중 오류가 발생했습니다.");
        } finally {
          setIsSubmitting(false); // 제출 완료 (성공 또는 실패)
        }
      } else {
        alert("캔버스 이미지를 Blob으로 변환할 수 없습니다.");
        setIsSubmitting(false); // 제출 완료 (실패)
      }
    }, "image/png");
  };

  return (
    <>
      <NeuralBackground isSurveyActive={true}/>
      <Header />
      <BackButton onClick={() => navigate('/main', { state: { cardIndex: 2 } })} aria-label="뒤로가기">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </BackButton>
      <PageContainer>
        <Inner>
          <HeaderBox>
            <Title>그림 검사</Title>
            <SubTitle>
              주어진 시계판 위에 <span>11시 10분</span>을 그려주세요.
            </SubTitle>
          </HeaderBox>
          <CanvasWrapper>
            <StyledCanvas
              ref={canvasRef}
              id="drawing-canvas"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            />
          </CanvasWrapper>
          <Controls>
            <Button className="clear" onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); handleClear(); }} disabled={isSubmitting}>모두 지우기</Button>
            <Button className="submit" onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); handleSubmit(); }} disabled={isSubmitting}>{isSubmitting ? "제출 중..." : "제출하기"}</Button>
          </Controls>
        </Inner>
      </PageContainer>
    </>
  );
};

export default DrawingPage;
  