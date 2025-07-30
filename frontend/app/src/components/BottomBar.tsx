import React from 'react';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Svg, { Path } from 'react-native-svg';

type BottomBarNavigationProp = StackNavigationProp<RootStackParamList>;

interface BottomBarProps {
  currentPage?: string;
}

interface StyledProps {
  isActive?: boolean;
}

const Container = styled.View`
  width: calc(100% - 32px);
  height: 40px;
  background: #262642;
  border-radius: 16px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  position: absolute;
  bottom: 24px;
  left: 16px;
  right: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const NavButton = styled.TouchableOpacity<StyledProps>`
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 12px;
  min-width: 50px;
  min-height: 50px;
  background-color: transparent;
  margin: 0 50px;
`;

// 홈 아이콘 SVG
const HomeIcon: React.FC<StyledProps> = ({ isActive }) => (
  <Svg width="28" height="28" fill="none" viewBox="0 0 24 24">
    <Path
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </Svg>
);

// 문서 아이콘 SVG (마이페이지용)
const DocumentIcon: React.FC<StyledProps> = ({ isActive }) => (
  <Svg width="28" height="28" fill="none" viewBox="0 0 24 24">
    <Path
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </Svg>
);

export default function BottomBar({ currentPage }: BottomBarProps) {
  const navigation = useNavigation<BottomBarNavigationProp>();

  return (
    <Container>
      <NavButton 
        isActive={currentPage === 'Main'}
        onPress={() => navigation.navigate('Main' as any)}
        activeOpacity={0.8}
      >
        <HomeIcon isActive={currentPage === 'Main'} />
      </NavButton>
      <NavButton 
        isActive={currentPage === 'MyPage'}
        onPress={() => navigation.navigate('MyPage' as any)}
        activeOpacity={0.8}
      >
        <DocumentIcon isActive={currentPage === 'MyPage'} />
      </NavButton>
    </Container>
  );
}