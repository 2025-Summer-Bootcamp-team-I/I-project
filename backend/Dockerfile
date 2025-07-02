# 1. Node.js 기반 이미지 사용
FROM node:20-slim

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. 종속성 복사 및 설치
COPY package*.json ./
RUN npm install

# 4. 소스 복사
COPY . .

# 5. 빌드
RUN npm run build

# 6. 실제 실행 파일
CMD ["node", "dist/index.js"]

# (포트가 있다면 아래처럼 명시 가능 - 선택)
EXPOSE 5000
