// src/components/Header.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import logoImage from '../assets/imgs/logo.png';

interface HeaderProps {
  showLogoText?: boolean;
  rightElement?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ showLogoText = true, rightElement }) => {
  const navigate = useNavigate();

  return (
    <HeaderBar>
      <LogoArea>
        <LogoImage src={logoImage} alt="Neurocare Logo" />
        {showLogoText && <LogoText>Neurocare 치매진단 서비스</LogoText>}
      </LogoArea>
      {rightElement ?? (
        <MyPageButton onClick={() => navigate('/mypage')}>마이페이지</MyPageButton>
      )}
    </HeaderBar>
  );
};

export default Header;

// --- 스타일 ---
const HeaderBar = styled.header`
  position: fixed;
  top: 0;
  left: 0; right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2.5rem;
  background: rgba(16, 18, 36, 0.93);
  backdrop-filter: blur(18px);
  z-index: 100;
`;

const LogoArea = styled.div`
  display: flex;
  align-items: center;
  gap: 0.78rem;
`;

const LogoImage = styled.img`
  width: 2.5rem;
  height: 2.5rem;
  display: block;
  object-fit: contain;
`;

const LogoText = styled.span`
  font-size: 1.3rem;
  font-weight: 700;
  color: #96e7d4;
  letter-spacing: -1px;
`;

const MyPageButton = styled.button`
  background: transparent;
  border: 1.7px solid #96E7D4;
  color: #96e7d4;
  border-radius: 999px;
  cursor: pointer;
  font-size: 1.01rem;
  font-weight: 700;
  padding: 0.5rem 1.2rem;
  transition: background 0.15s, color 0.15s;
  &:hover {
    background: #96e7d41a;
    color: #fff;
  }
`;
