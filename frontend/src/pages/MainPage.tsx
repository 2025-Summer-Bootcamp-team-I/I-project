// src/pages/MainPage.tsx
import styled from 'styled-components';
import NeuralBackground from '../components/Background';

const MainContainer = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const ContentOverlay = styled.div`
  position: relative;
  z-index: 1;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
`;

const MainPage = () => {
  return (
    <MainContainer>
      <NeuralBackground /> {/* ✅ 여기서 사용 */}
      <ContentOverlay>
        <h1>MainPage</h1>
        <p>3D 뉴런 네트워크 배경이 적용된 메인 페이지입니다.</p>
      </ContentOverlay>
    </MainContainer>
  );
};

export default MainPage;
