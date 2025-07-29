// src/components/AppHeader.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface HeaderProps {
  showLogoText?: boolean;
  rightElement?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ showLogoText = true, rightElement }) => {
  return (
    <View style={styles.headerBar}>
      <View style={styles.logoArea}>
        <Image 
          source={require('../assets/imgs/logo.png')} 
          style={styles.logoImage} 
          resizeMode="contain"
        />
        {showLogoText && (
          <View style={styles.textContainer}>
            <Text style={styles.logoText}>N E U R O C A R E</Text>
            <Text style={styles.subText}>치매 진단 서비스</Text>
          </View>
        )}
      </View>
      {rightElement}  
    </View>
  );
};

export default Header;

// --- 스타일 ---
const styles = StyleSheet.create({
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(16, 18, 36, 0.93)',
    zIndex: 100,
  },
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  logoImage: {
    width: 35,
    height: 35,
    marginRight: -1,
  },
  textContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
  },
  subText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    opacity: 1,
    marginTop: 0,
  },
});
