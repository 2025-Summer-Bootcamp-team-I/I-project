![KakaoTalk_20250803_234617129_05](https://github.com/user-attachments/assets/a89424fd-cd91-4b4a-84f8-94d3ddd9e612)<h1 align="center"> 2025 Techeer Summer BootCamp - Neurocare </h1>
<div align="center"> 
<h3><b> Early Dementia Diagnosis Service </b></h3><br>
<img width="1503" src="https://github.com/user-attachments/assets/7a0b40fa-4168-40ed-933f-ddba3e6e1e45" alt="대표 이미지">
<h3><b>Neuro+CARE= Neurocare</b></h3>
<br>
</div>


<div align="center">

</div>
<br><br>


# 📖 Table of contents
* [Introduction](#-introduction)
* [Demo](#-demo)
* [API](#-api)
* [System Architecture](#-system-architecture)
* [ERD](#-erd)
* [Tech Stack](#-tech-stack)
* [Monitoring](#-monitoring)
* [Directory Structure](#-directory-structure)
* [How to start](#-how-to-start)
* [Team Members](#-team-members)

<br>

# 📣 Introduction
### URL
> 💻 [Neurocare](https://neurocare.cloud/) - Web 버전
> 
> 📱 [Neurocare](https://app-neurocare.cloud/) - Mobile 버전

### Medium
> 🔎 [Neurocare Medium](https://medium.com/@kimseungmin0520/neurocare-early-dementia-diagnosis-service-5882eb5046d8) &nbsp;

<br>

- **AI를 활용한 초기 치매 진단 서비스**
- **Neuro+CARE= Neurocare**
- **사용자가 3개의 검사를 통해서 AI가 치매 점수를 판별**
- **AD8검사를 통해 빠르고 간단하게 검사 가능**
- **AI와의 대화를 통해서 사용자와의 대화 내용분석**
- **슐만 채점법을 통해 사용자가 그린 그림을 판별**
- **세 가지 테스트를 거쳐, 최종 분석 결과**
- **지난 리포트 기록 열람 가능**

<br>

# 🕺🏻 Demo
### Innit Animation
> Neurocare 접속하면 가장 먼저 보이는 화면입니다.
<br>
<img align="center" width="1000" alt="Onboarding" src="https://github.com/user-attachments/assets/7a0b40fa-4168-40ed-933f-ddba3e6e1e45">
<br><br>

### Login/Register
> 간편 로그인으로 나만의 인지 건강 여정을 시작할 수 있습니다.

<br>
<img align="center" width="1000" alt="Login & Sign up" src="https://github.com/user-attachments/assets/abc6b43e-d2ac-4678-bfd6-5dfb8f7d0022">
<br><br>

### Main
> 다양한 검사와 리포트, 자기 관리 기능에 한 번에 접근할 수 있는 Neurocare의 허브입니다.

<br>
<img align="center" width="1000" alt="Login & Sign up" src="https://github.com/user-attachments/assets/96cca022-91cb-4615-8a24-5a6335d05073">
<br><br>

### AD8
> 사용자가 AD8검사를 할수있는 페이지입니다.<br>
> 8개의 간단한 문항을 통해서 빠르고 간단하게 검사를 할 수 있습니다.

<br>
<img align="center" width="1000" alt="Login & Sign up" src="https://github.com/user-attachments/assets/3219b76b-458e-4777-8697-0c57c708f2b1">
<br><br>

### AI 대화 검사
> 사용자가 AI와의 대화를 할 수 있는페이지입니다.<br>
> 사용자는 음성 기반 대화와 텍스트 기반 대화를 선택해서 할 수 있습니다.
<br>
<img align="center" width="1000" alt="" src="https://github.com/user-attachments/assets/1794540e-0b7e-4706-97e9-444032b88f80"><br><br>
<img align="center" width="1000" alt="" src="https://github.com/user-attachments/assets/a6ba4093-d36f-4595-8d5d-af300467716b">
<br><br>

### 그림 검사 
> 사용자가 조건에 맞게 시계 그림을 그릴 수 있는 페이지입니다.<br>
> 널리 알려진 슐만 채점법을 통해서 사용자의 그림을 특정 점수로 AI가 판별합니다
<br>
<img align="center" width="1000" alt="Login & Sign up" src="https://github.com/user-attachments/assets/912cb271-6fc3-4f0f-b96a-8b0184e03b02">
<br><br>

### Loading
> 사용자 검사를 기반으로 AI 최종 리포트 생성을 기다리는 페이지입니다.<br>
<br>
<img align="center" width="1000" alt="" src="https://github.com/user-attachments/assets/3915872f-951c-4aa0-99a0-782bae836c71">
<br><br>

### Report
> 세 가지 테스트를 거쳐 나온, 최종 분석 결과를 볼 수 있는 페이지입니다.
> 각 항목별로 ‘양호 / 경계 / 위험’ 세 가지 등급으로 분류되며,시각화해서 한눈에 확인할 수 있습니다
<br>
<img align="center" width="1000" alt="" src="https://github.com/user-attachments/assets/db9770a2-1b2e-4329-8a48-f3158895ed4d">
<br><br>

### Mypage
> 과거 검사 이력과 자기 관리 기록을 확인하고, 꾸준한 건강 관리를 이어가는 공간입니다..<br>
<br>
<img align="center" width="1000" alt="" src="https://github.com/user-attachments/assets/13c9d363-2149-409b-a68e-fa4e7d91e42e">
<br><br>

### Neurocare App-Version
> Neurocare는 사용자의 편의성과 접근성을 위해서 앱 버전 또한 제공합니다 -.
<br>
<img align="center" width="1000" alt="" src="https://github.com/user-attachments/assets/22c1954e-1951-4a2a-ab4d-fb45123cfdd6">
<br><br>


<br>

# 📗 API
<img width="1503" src="https://github.com/user-attachments/assets/bf878657-839e-4c39-9e44-7aa49bfe750e" alt="API 이미지">


<br><br>

# 🛠 ️System Architecture <a name="-system-architecture"></a>
<div align="center">
  <img align="center" width="1000" src="https://github.com/user-attachments/assets/ed502a0f-06fd-465a-aa9b-0b7fb80532f4">
</div>
<br><br>

# 🔑 ERD
<div align="center">
  <img width="1000" src="">
</div>
<br><br>


# 💻 Tech Stack

<div align="center">
  <table>
    <tr>
      <th>Field</th>
      <th>Technology of Use</th>
    </tr>
    <tr>
      <td><b>Frontend</b></td>
      <td>
        <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black">
        <img src="https://img.shields.io/badge/React‑Native-61DAFB?style=for-the-badge&logo=react&logoColor=black">
        <img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white">
        <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
        <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white">
        <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
        <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white">
        <img src="https://img.shields.io/badge/Zustand-3E8EF7?style=for-the-badge&logo=Zustand&logoColor=white">
        <img src="https://img.shields.io/badge/Three.js-515A6E?style=for-the-badge&logo=threejs&logoColor=white">
        <img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white">
        <img src="https://img.shields.io/badge/Styled--Components-DB7093?style=for-the-badge&logo=styled-components&logoColor=white">
      </td>
    </tr>
    <tr>
      <td><b>Backend</b></td>
      <td>
        <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white">
        <img src="https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white">
        <img src="https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white">
      </td>
    </tr>
    <tr>
      <td><b>Database</b></td>
      <td>
        <img src="https://img.shields.io/badge/AmazonS3-569A31?style=for-the-badge&logo=amazon-s3&logoColor=white">
        <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
        <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white">
        <img src="https://img.shields.io/badge/AmazonRDS-527FFF?style=for-the-badge&logo=amazon-rds&logoColor=white">
        <img src="https://img.shields.io/badge/ChromaDB‑VectorDB-0033CC?style=for-the-badge&logo=chroma&logoColor=white">
      </td>
    </tr>
    <tr>
      <td><b>AI</b></td>
      <td>
        <img src="https://img.shields.io/badge/OpenAI-74aa9c?style=for-the-badge&logo=openai&logoColor=white">
        <img src="https://img.shields.io/badge/Gemini‑AI‑Model-4285F4?style=for-the-badge&logo=google&logoColor=white">
      </td>
      </td>
    </tr>
    <tr>
      <td><b>DevOps</b></td>
      <td>
        <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white">
        <img src="https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white">
        <img src="https://img.shields.io/badge/AmazonEC2-FF9900?style=for-the-badge&logo=amazon-ec2&logoColor=black">
        <img src="https://img.shields.io/badge/GitHubActions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white">
        <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white">
      </td>
    </tr>
    <tr>
      <td><b>Monitoring</b></td>
      <td>
        <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white">
        <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white">
        <img src="https://img.shields.io/badge/cAdvisor-0078D7?style=for-the-badge&logo=google&logoColor=white">
        <img src="https://img.shields.io/badge/NewRelic-FF6600?style=for-the-badge&logo=newrelic&logoColor=white">
        <img src="https://img.shields.io/badge/Sentry-FF5722?style=for-the-badge&logo=sentry&logoColor=white">
      </td>
    </tr>
    <tr>
      <td><b>ETC</b></td>
      <td>
        <img src="https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white">
        <img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white">
        <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white">
        <img src="https://img.shields.io/badge/Zoom-2D8CFF?style=for-the-badge&logo=zoom&logoColor=white">
        <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white">
        <img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black">
      </td>
    </tr>
  </table>
</div>
<br><br>

# 📊 Monitoring
<div align="center">
  <h3 align="left">Prometheus & Grafana & NewRelic</h3>
  <table>
        <tr>
            <th>cAdvisor</th>
            <th>NewRelic</th>
        </tr>
        <tr>
            <td><img src="https://github.com/user-attachments/assets/816767a6-78fe-4bbf-a002-64df095e782d" alt="cAdvisor"></td>
            <td><img src="https://github.com/user-attachments/assets/a8c38eff-1a08-4ac1-88c9-ed45e032d571">
        </tr>
        <tr>
            <th colspan="2">Node_Exporter</th>
        </tr>
        <tr>
            <td><img src="https://github.com/user-attachments/assets/06fcbde5-0711-4763-93b4-5d369ae01712"></td>
            <td><img src="https://github.com/user-attachments/assets/238fe87e-34f8-47ec-b21a-3c7ea994a10c" alt="Node Exporter2"></td>
        </tr>
        <tr>
          <th>Nginx_Exporter</th>
          <th>Redis</th>
        </tr>
        <tr>
          <td><img src="https://github.com/user-attachments/assets/478b8f01-1ee9-4e73-b802-02730e3e6aea"></td>
          <td><img src="https://github.com/user-attachments/assets/ee8f97ef-5f51-4dfb-b80c-07b672eed554"></td>
        </tr>
    </table>
  <br>
</div>
<br>



  
  <h3 align="left">Sentry</h3>
<table>
  <tr>
      <th colspan="2">Frontend</th>
  </tr>
  <tr>
      <td><img src="https://github.com/user-attachments/assets/521553e2-3cb1-496d-bddb-6d5bd623cd1b" alt="Sentry"/></td>
  </tr>
</table>

<br>

# 📂 Directory Structure

<details>
    <summary>Neurocare</summary>
<pre>
<code>
🗂️Project
┣ ��backend
┃ ┣ ��app
┃ ┃ ┣ 📂ad8
┃ ┃ ┃ ┣ ��__init__.py
┃ ┃ ┃ ┣ ��api.py
┃ ┃ ┃ ┣ 📃crud.py
┃ ┃ ┃ ┣ 📃models.py
┃ ┃ ┃ ┣ 📃schemas.py
┃ ┃ ┃ ┗ ��service.py
┃ ┃ ┣ 📂auth
┃ ┃ ┃ ┣ ��api.py
┃ ┃ ┃ ┣ 📃crud.py
┃ ┃ ┃ ┣ 📃models.py
┃ ┃ ┃ ┣ 📃schemas.py
┃ ┃ ┃ ┣ 📃service.py
┃ ┃ ┃ ┗ 📃utils.py
┃ ┃ ┣ 📂chat
┃ ┃ ┃ ┣ ��api.py
┃ ┃ ┃ ┣ 📃crud.py
┃ ┃ ┃ ┣ ��memory_store.py
┃ ┃ ┃ ┣ 📃models.py
┃ ┃ ┃ ┣ 📃schemas.py
┃ ┃ ┃ ┣ 📃service.py
┃ ┃ ┃ ┗ ��stream_handler.py
┃ ┃ ┣ 📂drawing
┃ ┃ ┃ ┣ ��api.py
┃ ┃ ┃ ┣ 📃crud.py
┃ ┃ ┃ ┣ 📃models.py
┃ ┃ ┃ ┣ 📃schemas.py
┃ ┃ ┃ ┣ 📃service.py
┃ ┃ ┃ ┗ 📃utils.py
┃ ┃ ┣ 📂mypage
┃ ┃ ┃ ┣ 📃api.py
┃ ┃ ┃ ┗ ��schemas.py
┃ ┃ ┣ 📂rag
┃ ┃ ┃ ┣ ��__init__.py
┃ ┃ ┃ ┣ 📃api.py
┃ ┃ ┃ ┣ ��pipeline.py
┃ ┃ ┃ ┗ ��service.py
┃ ┃ ┣ ��report
┃ ┃ ┃ ┣ ��__init__.py
┃ ┃ ┃ ┣ ��api.py
┃ ┃ ┃ ┣ 📃crud.py
┃ ┃ ┃ ┣ 📃models.py
┃ ┃ ┃ ┣ 📃schemas.py
┃ ┃ ┃ ┗ ��service.py
┃ ┃ ┣ ��report_view
┃ ┃ ┃ ┗ 📃report_view.py
┃ ┃ ┣ ��trans
┃ ┃ ┃ ┣ ��stt.py
┃ ┃ ┃ ┗ 📃tts.py
┃ ┃ ┣ 📃__init__.py
┃ ┃ ┣ 📃celery.py
┃ ┃ ┣ 📃database.py
┃ ┃ ┗ 📃worker.py
┃ ┣ 📂scripts
┃ ┃ ┣ 📃check_chroma_docs.py
┃ ┃ ┣ 📃count_chunks_by_title.py
┃ ┃ ┗ 📃delete_chroma_collection.py
┃ ┣ 📂static
┃ ┃ ┗ 📂uploads
┃ ┃   ┗ ��drawings
┃ ┣ ��temp
┃ ┣ 📂venv
┃ ┣ ��__init__.py
┃ ┣ 📃Dockerfile
┃ ┣ 📃main.py
┃ ┗ 📃requirements.txt
┣ ��frontend
┃ ┣ ��app
┃ ┃ ┣ ��src
┃ ┃ ┃ ┣ 📂api
┃ ┃ ┃ ┃ ┗ ��index.ts
┃ ┃ ┃ ┣ ��assets
┃ ┃ ┃ ┃ ┗ 📂imgs
┃ ┃ ┃ ┣ 📂components
┃ ┃ ┃ ┃ ┣ ��AppHeader.tsx
┃ ┃ ┃ ┃ ┣ 📃AppinitBackground.tsx
┃ ┃ ┃ ┃ ┣ 📃AppinitBackgrounds.tsx
┃ ┃ ┃ ┃ ┣ 📃AppLoginBackground.tsx
┃ ┃ ┃ ┃ ┗ ��BottomBar.tsx
┃ ┃ ┃ ┣ 📂pages
┃ ┃ ┃ ┃ ┣ ��AD8Page.tsx
┃ ┃ ┃ ┣ 📃ChattingSelectPage.tsx
┃ ┃ ┃ ┣ ��DrawingPage.tsx
┃ ┃ ┃ ┣ 📃InitPage.tsx
┃ ┃ ┃ ┣ ��LoadingPage.tsx
┃ ┃ ┃ ┣ ��LoginPage.tsx
┃ ┃ ┃ ┣ 📃MainPage.tsx
┃ ┃ ┃ ┣ 📃MyPage.tsx
┃ ┃ ┃ ┣ 📃RegisterPage.tsx
┃ ┃ ┃ ┣ 📃ReportPage.tsx
┃ ┃ ┃ ┣ ��TextChattingPage.tsx
┃ ┃ ┃ ┗ 📃VoiceChattingPage.tsx
┃ ┃ ┃ ┣ 📂store
┃ ┃ ┃ ┃ ┣ 📃chatStore.ts
┃ ┃ ┃ ┃ ┣ 📃reportHistoryStore.ts
┃ ┃ ┃ ┃ ┣ 📃reportIdStore.ts
┃ ┃ ┃ ┃ ┣ 📃reportStore.ts
┃ ┃ ┃ ┃ ┣ 📃testStore.ts
┃ ┃ ┃ ┃ ┗ ��voiceChatStore.ts
┃ ┃ ┃ ┣ 📂types
┃ ┃ ┃ ┃ ┣ ��api.ts
┃ ┃ ┃ ┃ ┣ 📃image.d.ts
┃ ┃ ┃ ┃ ┗ 📃react-native-html-to-pdf.d.ts
┃ ┃ ┃ ┣ 📃App.css
┃ ┃ ┃ ┣ 📃App.tsx
┃ ┃ ┃ ┣ ��AppStyle.ts
┃ ┃ ┃ ┣ 📃index.css
┃ ┃ ┃ ┣ ��main.tsx
┃ ┃ ┃ ┗ ��vite-env.d.ts
┃ ┃ ┣ 📃app.json
┃ ┃ ┣ ��babel.config.js
┃ ┃ ┣ ��metro.config.js
┃ ┃ ┣ ��package-lock.json
┃ ┃ ┣ 📃package.json
┃ ┃ ┗ 📃tsconfig.json
┃ ┣ ��shared
┃ ┃ ┣ ��api
┃ ┃ ┃ ┗ 📃index.ts
┃ ┃ ┣ ��assets
┃ ┃ ┃ ┗ 📂imgs
┃ ┃ ┣ 📂components
┃ ┃ ┃ ┣ 📃Background.tsx
┃ ┃ ┃ ┣ 📃Header.tsx
┃ ┃ ┃ ┣ ��index.ts
┃ ┃ ┃ ┣ ��InitBackground.tsx
┃ ┃ ┃ ┣ ��LoginBackground.tsx
┃ ┃ ┃ ┗ ��ProtectedRoute.tsx
┃ ┃ ┣ 📂constants
┃ ┃ ┃ ┗ 📃index.ts
┃ ┃ ┣ 📂store
┃ ┃ ┃ ┣ 📃chatStore.ts
┃ ┃ ┃ ┣ ��index.ts
┃ ┃ ┃ ┣ 📃reportHistoryStore.ts
┃ ┃ ┃ ┣ 📃reportIdStore.ts
┃ ┃ ┃ ┣ 📃reportStore.ts
┃ ┃ ┃ ┣ 📃testStore.ts
┃ ┃ ┃ ┗ ��voiceChatStore.ts
┃ ┃ ┣ ��types
┃ ┃ ┃ ┣ 📃api.ts
┃ ┃ ┃ ┣ ��html2pdf.d.ts
┃ ┃ ┃ ┗ 📃images.d.ts
┃ ┃ ┣ 📂utils
┃ ┃ ┃ ┗ 📃index.ts
┃ ┃ ┣ ��index.ts
┃ ┃ ┗ 📃tsconfig.json
┃ ┗ ��web
┃   ┣ 📂public
┃   ┃ ┗ 📃vite.svg
┃   ┣ ��src
┃   ┃ ┣ 📂api
┃   ┃ ┃ ┗ ��index.ts
┃   ┃ ┣ ��assets
┃   ┃ ┃ ┗ 📂imgs
┃   ┃ ┣ 📂components
┃   ┃ ┃ ┣ 📃Background.tsx
┃   ┃ ┃ ┣ 📃Header.tsx
┃   ┃ ┃ ┣ ��InitBackground.tsx
┃   ┃ ┃ ┣ ��LoginBackground.tsx
┃   ┃ ┃ ┗ ��ProtectedRoute.tsx
┃   ┃ ┣ 📂pages
┃   ┃ ┃ ┣ ��AD8Page.tsx
┃   ┃ ┃ ┣ 📃ChattingSelectPage.tsx
┃   ┃ ┃ ┣ ��DrawingPage.tsx
┃   ┃ ┃ ┣ 📃InitPage.tsx
┃   ┃ ┃ ┣ ��LoadingPage.tsx
┃   ┃ ┃ ┣ ��LoginPage.tsx
┃   ┃ ┃ ┣ 📃MainPage.tsx
┃   ┃ ┃ ┣ 📃MyPage.tsx
┃   ┃ ┃ ┣ 📃RegisterPage.tsx
┃   ┃ ┃ ┣ 📃ReportPage.tsx
┃   ┃ ┃ ┣ ��TextChattingPage.tsx
┃   ┃ ┃ ┗ 📃VoiceChattingPage.tsx
┃   ┃ ┣ 📂store
┃   ┃ ┃ ┣ 📃chatStore.ts
┃   ┃ ┃ ┣ 📃reportHistoryStore.ts
┃   ┃ ┃ ┣ 📃reportIdStore.ts
┃   ┃ ┃ ┣ 📃reportStore.ts
┃   ┃ ┃ ┣ 📃testStore.ts
┃   ┃ ┃ ┗ ��voiceChatStore.ts
┃   ┃ ┣ 📂types
┃   ┃ ┃ ┣ ��api.ts
┃   ┃ ┃ ┗ ��html2pdf.d.ts
┃   ┃ ┣ 📃App.css
┃   ┃ ┣ 📃App.tsx
┃   ┃ ┣ 📃index.css
┃   ┃ ┣ ��main.tsx
┃   ┃ ┗ ��vite-env.d.ts
┃   ┣ ��Dockerfile
┃   ┣ 📃eslint.config.js
┃   ┣ ��index.html
┃   ┣ 📃package.json
┃   ┣ 📃README.md
┃   ┣ ��tsconfig.app.json
┃   ┣ ��tsconfig.json
┃   ┣ ��tsconfig.node.json
┃   ┗ ��vite.config.ts
┣ 📂grafana
┃ ┗ 📂provisioning
┃   ┣ 📂dashboards
┃   ┃ ┣ 📃cadvisor-exporter.json
┃   ┃ ┣ ��dashboard.yml
┃   ┃ ┣ 📃docker-monitoring.json
┃   ┃ ┣ 📃fastapi-monitoring.json
┃   ┃ ┣ 📃fastapi-observability.json
┃   ┃ ┣ ��mysql-overview.json
┃   ┃ ┣ 📃rabbitmq-overview.json
┃   ┃ ┗ 📃redis-dashboard.json
┃   ┣ ��datasources
┃   ┃ ┗ 📃prometheus.yml
┃   ┗ 📃grafana.ini
┣ 📂prometheus
┃ ┗ ��prometheus.yml
┣ 📃LICENSE
┣ 📃README.md
┗ ��docker-compose.yml
</code>
</pre>
</details>
<br>

# 🧐 How To Start

### Frontend & Backend 
```
git clone https://github.com/2025-Summer-Bootcamp-team-I/I-project
```
### env setting 
* Frontend/.env
```
VITE_SENTRY_DSN
```
* Backend/.env
```
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=

CHROMA_API_IMPL=
CHROMA_SERVER_HOST=
CHROMA_SERVER_HTTP_PORT=

OPENAI_API_KEY=
GEMINI_API_KEY=
GOOGLE_API_KEY=

NEW_RELIC_LICENSE_KEY=
NEW_RELIC_APP_NAME=

SEMANTIC_SCHOLAR_API_KEY=
ELEVENLABS_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=
```
### Run Docker & Backend start
```
docker compose up --build
```
### Frontend Start
```
npm run dev(web)
npx expo start(app)
```
<br>

# 👨‍👩‍👧‍👦 Team Members
<table width="1000">
<thead>
</thead>
<tbody>

<tr>
<th>Name</th>
<td width="100" align="center">김지민</td>
<td width="100" align="center">김승민</td>
<td width="100" align="center">배경준</td>
<td width="100" align="center">김도윤</td>
<td width="100" align="center">백지원</td>
<td width="100" align="center">이주희</td>
</tr>


<tr>
<th>Profile</th>
<td width="100" align="center">
<a href="https://github.com/Jimin15">
<img src="https://github.com/user-attachments/assets/bd4af24f-9d34-498c-9f00-123b53759fd5" width="60" height="60">
</a>
</td>
<td width="100" align="center">
<a href="https://github.com/ksm0520">
<img src="https://github.com/user-attachments/assets/dbcf5c78-d64a-47dd-8507-f201c8ab1018" width="60" height="60">
</a>
</td>
<td width="100" align="center">
<a href="https://github.com/plar8271">
<img src="https://github.com/user-attachments/assets/ed53db66-aac6-4abb-b126-fb5c534b4046" width="60" height="60">
</a>
</td>
<td width="100" align="center">
<a href="https://github.com/doyun-cumulus">
<img src="https://github.com/user-attachments/assets/e0fb55f8-9edb-4eb0-ae35-ce81e973a49c" width="60" height="60">
</a>
</td>
<td width="100" align="center">
<a href="https://github.com/jiwon5">
<img src="https://github.com/user-attachments/assets/bef3fece-ba6f-4f7e-b3ab-2ac41caa257f" width="60" height="60">
</a>
</td>
<td width="100" align="center">
<a href="https://github.com/johe00123">
<img src="https://github.com/user-attachments/assets/98f3ac3b-7e7c-4ca9-9dff-244bc9ee0ab1" width="60" height="60">
</a>
</td>
</tr>

<tr>
<th>Role</th>
<td width="190" align="center">
Leader<br>
Backend<br>
DevOps<br>
Design<br>
</td>
<td width="190" align="center">
Full Stack<br>
DevOps<br>
Design<br>
</td>
<td width="190" align="center">
Frontend<br>
DevOps<br>
Design<br>
</td>
<td width="190" align="center">
Frontend<br>
Design<br>
</td>
<td width="190" align="center">
Backend<br>
Design<br>
</td>
<td width="190" align="center">
Backend<br>
Design<br>
</td>

<tr>
<th>GitHub</th>
<td width="100" align="center">
<a href="https://github.com/Jimin15">
<img src="http://img.shields.io/badge/Jimin15-green?style=social&logo=github"/>
</a>
</td>
<td width="100" align="center">
<a href="https://github.com/ksm0520">
<img src="http://img.shields.io/badge/ksm0520-green?style=social&logo=github"/>
</a>
</td>
<td width="100" align="center">
<a href="https://github.com/plar8271">
<img src="http://img.shields.io/badge/plar8271-green?style=social&logo=github"/>
</a>
</td>
<td width="100" align="center">
<a href="https://github.com/doyun-cumulus">
<img src="http://img.shields.io/badge/doyun-cumulus-green?style=social&logo=github"/>
</a>
</td>
<td width="100" align="center">
<a href="https://github.com/jiwon5">
<img src="http://img.shields.io/badge/jiwon5-green?style=social&logo=github"/>
</a>
</td>
<td width="100" align="center">
<a href="https://github.com/johe00123">
<img src="http://img.shields.io/badge/johe00123-green?style=social&logo=github"/>
</a>
</td>
</tr>
</tbody>
</table>
<br><br><br><br>

