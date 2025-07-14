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
        <Route path="/drawing" element={<DrawingPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/chatting-select" element={<ChattingSelectPage />} />
        <Route path="/chatting/voice" element={<VoiceChattingPage />} />
        <Route path="/chatting/text" element={<TextChattingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
