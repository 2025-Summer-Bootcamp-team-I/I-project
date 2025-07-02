# 1. Node.js 이미지 (빌드 용도)
FROM node:20-slim AS builder

# 2. 작업 디렉토리
WORKDIR /app

# 3. 패키지 복사 및 설치
COPY package*.json ./
RUN npm install

# 4. 소스 복사 및 빌드
COPY . .
RUN npm run build

# 5. Nginx 기반으로 정적 파일 서빙
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
