# 1. Node.js 20-slim 이미지 사용
FROM node:20-slim

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 패키지 파일 복사 후 의존성 설치 (캐시 활용 위해 분리)
COPY package*.json ./
RUN npm install

# 4. 전체 소스 복사 (Swagger 포함된 src 전체)
COPY . .

# 5. TypeScript 빌드 (Swagger 포함된 라우터 및 라우터 주석 포함)
RUN npm run build

# 6. 실행 (Swagger 포함된 Express 엔트리 파일 실행)
CMD ["node", "dist/index.js"]

# 7. 외부 포트 오픈
EXPOSE 5000
