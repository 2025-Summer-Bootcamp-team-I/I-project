// src/components/Header.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

interface HeaderProps {
  showLogoText?: boolean;
  rightElement?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ showLogoText = true, rightElement }) => {
  const navigate = useNavigate();

  return (
    <HeaderBar>
      <LogoArea>
        <LogoSVG viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="#96e7d4" opacity="0.15"/>
          <path d="M20 10c2 0 3 1 3 3v5h-6v-5c0-2 1-3 3-3zm-2 8h4c0 3-1.5 6-4 6s-4-3-4-6h4z" fill="#96e7d4"/>
        </LogoSVG>
        {showLogoText && <LogoText>기억 건강 진단</LogoText>}
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

const LogoSVG = styled.svg`
  width: 2.1rem;
  height: 2.1rem;
  display: block;
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
  color: #96E7D4;
  border-radius: 999px;
  cursor: pointer;
  font-size: 1.01rem;
  padding: 0.5rem 1.2rem;
  transition: background 0.15s, color 0.15s;
  &:hover {
    background: #96e7d41a;
    color: #fff;
  }
`;
