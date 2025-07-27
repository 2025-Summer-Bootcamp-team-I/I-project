import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import LoginBackground from "@shared/components/LoginBackground";
import { useState } from "react"; // useState 임포트
import { loginUser } from "@shared/api"; // loginUser 임포트
import type { LoginData } from "@shared/types/api"; // LoginData 임포트

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); // 이메일 상태
  const [password, setPassword] = useState(""); // 비밀번호 상태

  const handleLogin = async (e: React.FormEvent) => { // async 추가
    e.preventDefault();
    try {
      const userData: LoginData = { email, password };
      const loginResponse = await loginUser(userData);
      console.log("로그인 성공:", loginResponse);

      navigate("/main");
    } catch (error) {
      alert("로그인 실패: 이메일 또는 비밀번호를 확인해주세요.");
      console.error("로그인 에러:", error);
    }
  };

  return (
    <Wrapper>
      <LoginBackground />
      <FormContainer onSubmit={handleLogin}>
        <Title>로그인</Title>
        <Input
          type="email"
          placeholder="이메일"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)} // 이메일 입력 핸들러
        />
        <Input
          type="password"
          placeholder="비밀번호"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)} // 비밀번호 입력 핸들러
        />
        <Button type="submit">로그인</Button>
        <StyledLink to="/register">계정이 없으신가요? 회원가입</StyledLink>
      </FormContainer>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #0c0a1a; /* temp2.html의 body 배경색 */
`;

const FormContainer = styled.form`
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2.5rem;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  z-index: 1;
  animation: fadeIn 1s ease-out forwards;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  color: white;
  margin-bottom: 1rem;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  color: white;
  transition: border-color 0.2s, box-shadow 0.2s;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
  }
`;

const Button = styled.button`
  width: 100%;
  box-sizing: border-box;
  background: #8b5cf6;
  color: white;
  font-weight: 700;
  padding: 0.875rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #7c3aed;
  }
`;

const StyledLink = styled(Link)`
  color: #c4b5fd;
  display: inline-block;
  text-align: center;
  text-decoration: none;
  margin: 1rem auto 0;
  &:hover {
    text-decoration: underline;
  }
`;