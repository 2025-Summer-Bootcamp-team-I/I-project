import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// 스타일, 타입 import (필요하다면)
import { commonStyles } from './AppStyle';

// 페이지 컴포넌트들
import InitPage from './pages/InitPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainPage from './pages/MainPage';
import MyPage from './pages/MyPage';
import AD8Page from './pages/AD8Page';
import DrawingPage from './pages/DrawingPage';
import LoadingPage from './pages/LoadingPage';
import ReportPage from './pages/ReportPage';
import ChattingSelectPage from './pages/ChattingSelectPage';
import VoiceChattingPage from './pages/VoiceChattingPage';
import TextChattingPage from './pages/TextChattingPage';

// 네비게이션 타입 정의
export type RootStackParamList = {
  Init: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  MyPage: undefined;
  AD8: undefined;
  Drawing: undefined;
  Loading: undefined;
  Report: { reportId?: string };
  ChattingSelect: undefined;
  VoiceChatting: undefined;
  TextChatting: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Init"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0c0a1a' },
        }}
      >
        <Stack.Screen name="Init" component={InitPage} />
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="Register" component={RegisterPage} />
        <Stack.Screen name="Main" component={MainPage} />
        <Stack.Screen name="MyPage" component={MyPage} />
        <Stack.Screen name="AD8" component={AD8Page} />
        <Stack.Screen name="Drawing" component={DrawingPage} />
        <Stack.Screen name="Loading" component={LoadingPage} />
        <Stack.Screen name="Report" component={ReportPage} />
        <Stack.Screen name="ChattingSelect" component={ChattingSelectPage} />
        <Stack.Screen name="VoiceChatting" component={VoiceChattingPage} />
        <Stack.Screen name="TextChatting" component={TextChattingPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
