import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,            // 개발 서버 포트 설정
    strictPort: true       // 포트가 이미 사용중이면 에러 낸 후 종료
  }
})
