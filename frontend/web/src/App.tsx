import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InitPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/ad8" element={<AD8Page />} />
        <Route path="/drawing" element={<ProtectedRoute requiredChat={true} alertMessage="대화 검사를 먼저 완료해주세요." redirectCardIndex={1}><DrawingPage /></ProtectedRoute>} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/report" element={<ProtectedRoute requiredDrawing={true} alertMessage="그림 검사를 먼저 완료해주세요." redirectCardIndex={2}><ReportPage /></ProtectedRoute>} />
        <Route path="/report/:reportId" element={<ReportPage />} />
        <Route path="/chatting-select" element={<ProtectedRoute requiredAD8={true} alertMessage="AD8 검사를 먼저 완료해주세요." redirectCardIndex={0}><ChattingSelectPage /></ProtectedRoute>} />
        <Route path="/chatting/voice" element={<ProtectedRoute requiredAD8={true} alertMessage="AD8 검사를 먼저 완료해주세요." redirectCardIndex={0}><VoiceChattingPage /></ProtectedRoute>} />
        <Route path="/chatting/text" element={<ProtectedRoute requiredAD8={true} alertMessage="AD8 검사를 먼저 완료해주세요." redirectCardIndex={0}><TextChattingPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
