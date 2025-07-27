import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { colors, spacing, fontSize, borderRadius } from '../AppStyle';
import Svg, { Path } from 'react-native-svg';

type MyPageNavigationProp = StackNavigationProp<RootStackParamList, 'MyPage'>;

export default function MyPage() {
  const navigation = useNavigation<MyPageNavigationProp>();
  const [userInfo, setUserInfo] = useState({
    name: '사용자',
    email: 'user@example.com',
  });
  const [testHistory, setTestHistory] = useState([
    { id: 1, date: '2024-01-15', type: 'AD8 검사', result: '정상' },
    { id: 2, date: '2024-01-10', type: '대화 검사', result: '정상' },
    { id: 3, date: '2024-01-05', type: '그림 검사', result: '정상' },
  ]);
  
  // 애니메이션 값들
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

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

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => {
            // 로그아웃 로직
            navigation.navigate('Login' as any);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            // 계정 삭제 로직
            navigation.navigate('Login' as any);
          },
        },
      ]
    );
  };

  const handleViewReport = (testId: number) => {
    navigation.navigate('Report' as any, { reportId: testId.toString() });
  };

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      
      {/* 헤더 */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Svg width="24" height="24" fill="none" stroke="#ffffff" viewBox="0 0 24 24">
            <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.logoContainer}>
                          <Image
          source={require('../../../shared/assets/imgs/logo.png')}
          style={styles.logoImage}
        />
          <Text style={styles.logoText}>Neurocare 치매진단 서비스</Text>
        </View>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* 메인 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>마이페이지</Text>
            <Text style={styles.headerSubtitle}>내 정보와 검사 기록</Text>
          </View>

          {/* 사용자 정보 */}
          <View style={styles.userInfoCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>👤</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userInfo.name}</Text>
              <Text style={styles.userEmail}>{userInfo.email}</Text>
            </View>
          </View>

          {/* 검사 기록 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>검사 기록</Text>
            {testHistory.map((test) => (
              <TouchableOpacity
                key={test.id}
                style={styles.historyItem}
                onPress={() => handleViewReport(test.id)}
                activeOpacity={0.7}
              >
                <View style={styles.historyContent}>
                  <Text style={styles.historyType}>{test.type}</Text>
                  <Text style={styles.historyDate}>{test.date}</Text>
                </View>
                <View style={styles.historyResult}>
                  <Text style={styles.resultText}>{test.result}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 설정 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>설정</Text>
            
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <Text style={styles.settingText}>알림 설정</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <Text style={styles.settingText}>개인정보 수정</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <Text style={styles.settingText}>비밀번호 변경</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* 로그아웃 및 계정 삭제 */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.actionButton, styles.logoutButton]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutButtonText}>로그아웃</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteAccount}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteButtonText}>계정 삭제</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
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
  
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  backButton: {
    backgroundColor: 'rgba(17, 24, 39, 0.82)',
    borderRadius: 20,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  
  logoImage: {
    width: 34,
    height: 34,
    marginRight: spacing.sm,
  },
  
  logoText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#96e7d4',
    letterSpacing: -1,
  },
  
  placeholder: {
    width: 40,
  },
  
  scrollView: {
    flex: 1,
  },
  
  content: {
    padding: spacing.md,
  },
  
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  
  headerTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  
  userInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  
  avatar: {
    fontSize: 30,
  },
  
  userDetails: {
    flex: 1,
  },
  
  userName: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  
  section: {
    marginBottom: spacing.lg,
  },
  
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  
  historyItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  historyContent: {
    flex: 1,
  },
  
  historyType: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  
  historyDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  
  historyResult: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  
  resultText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.text,
  },
  
  settingItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  settingText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  
  settingArrow: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  
  actionButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  logoutButton: {
    backgroundColor: colors.warning,
  },
  
  logoutButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  
  deleteButton: {
    backgroundColor: colors.error,
  },
  
  deleteButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
});
  