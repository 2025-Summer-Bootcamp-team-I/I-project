import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import NeuralBackground from '../components/Background';
import Header from "../components/Header";

const Container = styled.div`
  background: transparent;
  border-radius: 1rem;
  padding: 2rem;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const Inner = styled.div`
  width: 100%;
  max-width: 30rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CanvasWrapper = styled.div`
  width: 100%;
  max-width: 38rem;
  aspect-ratio: 1 / 1;
  margin: 2rem 0;
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
  min-width: 50rem;
  margin-top: -1rem;
`;



const Button = styled.button`
  padding: 0.7rem 1.5rem;
  border-radius: 0.7rem;
  font-weight: bold;
  font-size: 1rem;
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
  flex-shrink: 0;
  z-index: 100;
  color: #fff;
  position: fixed;
  top: 6rem;
  left: 2.2rem;
  margin: 0;
  &:hover {
    background: rgba(17, 24, 39, 1);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }
  &:focus {
    outline: none;
    box-shadow: none;
  }
  svg {
    width: 1.5rem;
    height: 1.5rem;
    margin: auto;
    color: #000;
  }
`;

const HeaderBox = styled.div`
  position: relative;
  width: 100%;
  text-align: center;
  margin-bottom: 1.5rem;
  margin-top: -1rem;
`;

const Title = styled.h2`
  font-size: 2.2rem;
  font-weight: bold;
  color: #7fcebb;
  margin-top: 4rem;
  margin-bottom: -2rem;
`;

const SubTitle = styled.p`
  color: #7fcebb;
  font-size: 1.2rem;
  margin-top: 2rem;
  margin-bottom: -2rem;
  span {
    color: #fff;
    font-weight: bold;
    font-size: 1.5rem;
  }
`;

const DrawingPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // 색상, 굵기 상태 제거됨
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
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
    ctx.lineWidth = 5;
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
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
  };

  // 제출
  const handleSubmit = () => {
    alert("그림이 제출되었습니다. (기능 구현 대기 중)");
    navigate(-1); // 이전 페이지로 이동
  };

  return (
    <>
      <NeuralBackground />
      <Container>
        <Header />
        <Inner>
          <HeaderBox>
            <BackButton onClick={() => navigate(-1)} aria-label="뒤로가기">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </BackButton>
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
            <Button className="clear" onClick={handleClear}>모두 지우기</Button>
            <Button className="submit" onClick={handleSubmit}>제출하기</Button>
          </Controls>
        </Inner>
      </Container>
    </>
  );
};

export default DrawingPage;
  