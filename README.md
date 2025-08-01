<h1 align="center"> 2025 Techeer Summer BootCamp - Neurocare </h1>
<div align="center"> 
<h3><b> Early Dementia Diagnosis Service </b></h3><br>
<img width="1503" src="https://raw.githubusercontent.com/ksm0520/practice/main/images/Neurocare/main.png" alt="대표 이미지">
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
> 🗝️ [Neurocare](https://neurocare.cloud/) 

### Medium
> 🔎 [Neurocare Medium](https://medium.com/p/5882eb5046d8/edit) &nbsp;

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
<img align="center" width="1000" alt="Onboarding" src="https://github.com/user-attachments/assets/dd639618-abbe-4ee2-8907-4adfa1d74c6c">
<br><br>

### Login/Register
> E-mail 기반 로그인 및 회원가입으로 손쉽게 로그인 할 수 있습니다.
<br>
<img align="center" width="1000" alt="Login & Sign up" src="https://github.com/user-attachments/assets/1487ef46-1858-4be6-b8a2-51f7d2f5866e">
<br><br>

### Main
> 성공적인 로그인 이후 치매 진단을 위한 메인 페이지입니다.
<br>
<img align="center" width="1000" alt="Login & Sign up" src="https://github.com/user-attachments/assets/b44f2bc8-aada-49f1-a099-9112e6edb310">
<br><br>

### AD8
> 사용자가 AD8검사를 할수있는 페이지입니다.<br>
> 8개의 간단한 문항을 통해서 빠르고 간단하게 검사를 할 수 있습니다.
<br>
<img align="center" width="1000" alt="Login & Sign up" src="https://github.com/user-attachments/assets/33b7c33a-f3d0-49c6-a216-87081019573f">
<br><br>

### AI 대화 검사
> 사용자가 AI와의 대화를 할 수 있는페이지입니다.<br>
> 사용자는 음성 기반 대화와 텍스트 기반 대화를 선택해서 할 수 있습니다.
<br>
<img align="center" width="1000" alt="" src="https://github.com/user-attachments/assets/1fc8ab99-0bd8-42cd-90d6-ba3e287e6fec"><br><br>
<img align="center" width="1000" alt="" src="https://github.com/user-attachments/assets/f3c609bb-29cb-4714-9152-d39f017aece2">
<br><br>

### 그림 검사 
> 사용자가 조건에 맞게 시계 그림을 그릴 수 있는 페이지입니다.<br>
> 널리 알려진 슐만 채점법을 통해서 사용자의 그림을 특정 점수로 AI가 판별합니다
<br>
<img align="center" width="1000" alt="Login & Sign up" src="https://github.com/user-attachments/assets/33b7c33a-f3d0-49c6-a216-87081019573f">
<br><br>

### Loading
> 사용자 검사를 기반으로 AI 최종 리포트 생성을 기다리는 페이지입니다.<br>
<br>
<img align="center" width="1000" alt="" src="https://github.com/user-attachments/assets/a9e54428-3c14-432e-82ba-d698e32e9146">
<br><br>

### Report
> 세 가지 테스트를 거쳐 나온, 최종 분석 결과를 볼 수 있는 페이지입니다.
> 각 항목별로 ‘양호 / 경계 / 위험’ 세 가지 등급으로 분류되며,시각화해서 한눈에 확인할 수 있습니다
<br>
<img align="center" width="1000" alt="" src="https://github.com/user-attachments/assets/a1c11bd9-ee42-4f69-9b86-da4e547f7240">
<br><br>

### Mypage
> 지난 리포트의 기록을 저장 및 확인 할 수 있는 페이지입니다.<br>
<br>
<img align="center" width="1000" alt="" src="https://github.com/user-attachments/assets/200c9fb4-e6a9-4ba2-89d7-fe4bcc0b7a84">
<br><br>

### App-Version
> 기존 서비스의 앱 버전 입니다.
<br>
<img align="center" width="1000" alt="" src="https://github.com/user-attachments/assets/b3b5ce61-0192-443b-b117-06fd9cf4103d">
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
  <img width="1000" src="https://github.com/user-attachments/assets/b15b3f76-c856-40fb-961b-90f7473f1fef">
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
            <th colspan="2">Django</th>
        </tr>
        <tr>
            <td><img src="https://github.com/user-attachments/assets/dfe25a06-b23d-41b4-a95e-2a7f66769b16" alt="Django"></td>
            <td><img src="https://github.com/user-attachments/assets/59e892d8-76d5-463f-90c2-a025d8faf23b" alt="Django2"></td>
        </tr>
        <tr>
            <th colspan="2">Celery</th>
        </tr>
        <tr>
            <td><img src="https://github.com/user-attachments/assets/074048e6-4ece-43f9-9800-2f2d523f2930" alt="Celery"></td>
            <td><img src="https://github.com/user-attachments/assets/8d67960d-b60e-4a37-9597-7eabeed8c6fb" alt="Celery2"></td>
        </tr>
        <tr>
            <th colspan="2">cAdvisor</th>
        </tr>
        <tr>
            <td><img src="https://github.com/user-attachments/assets/5c995407-38a8-4949-8807-c6678e15adea" alt="cAdvisor"></td>
            <td><img src="https://github.com/user-attachments/assets/8ec92d68-418e-4d97-a288-88bf7b0e4bac" alt="cAdvisor2"></td>
        </tr>
        <tr>
            <th colspan="2">Node_Exporter</th>
        </tr>
        <tr>
            <td><img src="https://github.com/user-attachments/assets/ecd13865-d1f4-4f34-af30-2d91b081b7b8"></td>
            <td><img src="https://github.com/user-attachments/assets/cff8c04a-700c-45ad-ad84-017d343d2e3d" alt="Node Exporter2"></td>
        </tr>
        <tr>
            <th colspan="2">RabbitMQ</th>
        </tr>
        <tr>
            <td><img src="https://github.com/user-attachments/assets/e41beaed-0e21-4f7d-82b0-e86a8a6b9f37"></td>
            <td><img src="https://github.com/user-attachments/assets/1dd07d64-3548-476f-a68a-7b5e613b49cc" alt="Node Exporter2"></td>
        </tr>
        <tr>
          <th>Nginx_Exporter</th>
          <th>Redis</th>
        </tr>
        <tr>
          <td><img src="https://github.com/user-attachments/assets/ef00a11f-e77a-40a2-ad32-b19d67b65e2a"></td>
          <td><img src="https://github.com/user-attachments/assets/67a6e2fb-fa01-4172-9a86-a0b17a847379"></td>
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

