import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import InitBackground from "../components/InitBackground";

/**
 * InitPage 컴포넌트 - 온보딩 페이지
 * 
 * Three.js를 사용하여 3D 파티클로 구성된 인터랙티브한 뇌 모양을 표현합니다.
 * 사용자의 마우스 움직임에 반응하고, 클릭 시 애니메이션 효과와 함께 시작 버튼을 보여줍니다.
 */
export default function InitPage() {
  // Three.js 캔버스를 담을 div 요소의 참조
  const canvasRef = useRef<HTMLDivElement>(null);
  // 사용자 상호작용 완료 상태
  const [interactionCompleted, setInteractionCompleted] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Three.js 관련 변수 선언
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let brainParticles: THREE.Points;
    let animationFrameId: number;
    const mouse = new THREE.Vector2(-100, -100);  // 마우스 위치 초기값을 화면 밖으로 설정
    const clock = new THREE.Clock();  // 애니메이션 타이밍을 위한 시계

    /**
     * Three.js 초기화 함수
     * 씬, 카메라, 렌더러 설정 및 파티클 시스템 생성
     */
    const init = () => {
      // 기본 Three.js 설정
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 25;  // 카메라 위치 설정

      // 렌더러 설정
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      
      if (canvasRef.current) {
        canvasRef.current.appendChild(renderer.domElement);
      }

      // 조명 설정
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);  // 전역 조명
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);  // 방향 조명
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // 파티클 시스템 설정
      const particleCount = 10000;  // 파티클 개수
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);  // x, y, z 좌표를 위한 배열
      const colors = new Float32Array(particleCount * 3);     // r, g, b 색상을 위한 배열
      const originalRadii = new Float32Array(particleCount);  // 각 파티클의 원래 반지름 저장

      // 파티클 색상 설정
      const colorInside = new THREE.Color(0x6a0dad);   // 안쪽 색상 (보라색)
      const colorOutside = new THREE.Color(0x0077ff);  // 바깥쪽 색상 (파란색)

      // 각 파티클의 위치와 색상 계산
      for (let i = 0; i < particleCount; i++) {
        // 구면 좌표계 사용하여 파티클 위치 계산
        const theta = Math.random() * 2 * Math.PI;  // 방위각 (0 ~ 2π)
        const phi = Math.acos((Math.random() * 2) - 1);  // 극각 (0 ~ π)
        let radius = 8 + (Math.random() - 0.5) * 4;  // 기본 반지름에 랜덤 변화 추가
        // 사인/코사인 함수로 뇌 모양의 울퉁불퉁한 표면 생성
        radius += Math.sin(theta * 6) * Math.cos(phi * 8) * 1.5;
        originalRadii[i] = radius;
        
        // 구면 좌표를 직교 좌표로 변환
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // 반지름에 따른 그라데이션 색상 계산
        const color = colorInside.clone().lerp(colorOutside, (radius - 6) / 6);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      // 버퍼 지오메트리에 속성 추가
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('originalRadius', new THREE.BufferAttribute(originalRadii, 1));

      // 파티클 재질 설정
      const material = new THREE.PointsMaterial({
        size: 0.1,                          // 파티클 크기
        vertexColors: true,                 // 개별 파티클 색상 사용
        transparent: true,                  // 투명도 활성화
        opacity: 0.8,                       // 기본 투명도
        blending: THREE.AdditiveBlending,   // 파티클 블렌딩 모드
        depthWrite: false,                  // 깊이 버퍼 비활성화
      });

      // 파티클 시스템 생성 및 씬에 추가
      brainParticles = new THREE.Points(geometry, material);
      scene.add(brainParticles);
    };

    /**
     * 창 크기 변경 시 처리 함수
     */
    const onWindowResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    /**
     * 마우스 이동 처리 함수
     * 마우스 좌표를 Three.js 좌표계로 변환 (-1 ~ 1 범위)
     */
    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    /**
     * 애니메이션 루프 함수
     * 매 프레임마다 파티클 위치와 크기를 업데이트
     */
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (brainParticles) {
        brainParticles.rotation.y += 0.001;  // 기본 회전
        
        if (!interactionCompleted) {
          // 상호작용 전: 마우스에 반응하는 파티클 움직임
          const positions = brainParticles.geometry.attributes.position.array;
          const radii = brainParticles.geometry.attributes.originalRadius.array;
          
          for (let i = 0; i < positions.length; i += 3) {
            const p = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]).normalize();
            const originalRadius = radii[i / 3];
            const mouseDist = p.distanceTo(new THREE.Vector3(mouse.x, mouse.y, 1));
            const mouseFactor = Math.max(0, 1 - mouseDist / 1.5);  // 마우스와의 거리에 따른 영향
            const waveFactor = Math.sin(originalRadius * 0.5 - elapsedTime);  // 시간에 따른 파동 효과
            const currentRadius = originalRadius + waveFactor * 0.2 + mouseFactor * 2.0;
            
            p.multiplyScalar(currentRadius);
            positions[i] = p.x;
            positions[i+1] = p.y;
            positions[i+2] = p.z;
          }
          brainParticles.geometry.attributes.position.needsUpdate = true;
        } else {
          // 상호작용 후: 파티클 크기 증가 및 빠른 회전
          (brainParticles.material as THREE.PointsMaterial).size += 
            (0.2 - (brainParticles.material as THREE.PointsMaterial).size) * 0.05;
          brainParticles.rotation.y += 0.005;
        }
      }

      renderer.render(scene, camera);
    };

    // 초기화 및 애니메이션 시작
    init();
    animate();

    // 이벤트 리스너 등록
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);

    // 컴포넌트 언마운트 시 정리
    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (renderer && canvasRef.current) {
        canvasRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [interactionCompleted]);

  /**
   * 화면 클릭 시 처리 함수
   * 상호작용 완료 상태로 전환
   */
  const handleInteraction = () => {
    if (!interactionCompleted) {
      setInteractionCompleted(true);
    }
  };

  /**
   * 시작 버튼 클릭 시 처리 함수
   * 로그인 페이지로 이동
   */
  const handleStart = () => {
    navigate('/login');
  };

  return (
    <Wrapper onClick={handleInteraction}>
      <InitBackground /> {/* LoginBackground 추가 */}
      <CanvasContainer ref={canvasRef} />
      <ContentContainer>
        <Title className={`ui-element ${interactionCompleted ? '' : 'visible'}`}>
          당신의 두뇌 건강
        </Title>
        <Subtitle className={`ui-element ${interactionCompleted ? '' : 'visible'}`}>
          그 소중한 여정을 함께합니다
        </Subtitle>
        {!interactionCompleted && (
          <InteractionPrompt className="ui-element visible">
            뇌를 터치하여 활성화하세요
          </InteractionPrompt>
        )}
        {interactionCompleted && (
          <StartButton onClick={handleStart} className="ui-element visible">
            검사 시작
          </StartButton>
        )}
      </ContentContainer>
    </Wrapper>
  );
}

/**
 * 스타일 컴포넌트 정의
 */
const Wrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  background: transparent; /* 배경을 투명하게 변경 */
  overflow: hidden;
  cursor: pointer;
`;

const CanvasContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* 기존 뇌 파티클의 z-index */
`;

const ContentContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  padding-bottom: 10vh;

  /* UI 요소 페이드인 애니메이션 */
  .ui-element {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 1s ease-out, transform 1s ease-out;
  }

  .ui-element.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-align: center;
  margin-top: -15vh;  /* 제목을 위쪽으로 이동 */
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  font-weight: 300;
  margin-bottom: 2rem;
  text-align: center;
`;

const InteractionPrompt = styled.p`
  font-size: 1.1rem;
  font-weight: 300;
  position: absolute;
  bottom: 30%;
  animation: pulse 2s infinite;  /* 깜빡이는 효과 */

  @keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
  }
`;

const StartButton = styled.button`
  font-size: 1.2rem;
  font-weight: 700;
  padding: 0.8rem 3rem;
  border-radius: 999px;
  background: white;
  color: #0c0a1a;
  border: none;
  position: absolute;
  bottom: 25%;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
    transform: scale(1.05);  /* 호버 시 약간 확대 */
  }
`;