# 🍱 ByteBite - 개인 맞춤형 냉장고 기반 레시피 추천 챗봇

> 냉장고 속 재료로 요리 고민 끝!
> 
> 
> 자취생과 요리 초보자를 위한 맞춤형 레시피 추천 챗봇 앱
> 

---

## 📌 프로젝트 개요

**ByteBite**는 사용자의 냉장고 속 재료, 요리 시간, 식사 스타일 등을 기반으로

개인 맞춤형 레시피를 추천해주는 대화형 챗봇 애플리케이션입니다.

---

## 🧑‍💻 개발 환경 및 사용 오픈소스

| 항목 | 내용 |
| --- | --- |
| IDE | Visual Studio Code |
| Python 버전 | 3.10.0 (※ Rasa 3.6.x와 호환 안정 버전) |
| Rasa | 3.6.21 |
| Rasa SDK | 3.6.1 |
| BeautifulSoup4 | 4.13.4 |
| Flask | 2.x 이상 |
| SQLite | 내장 DB 사용 |
| React Native | Expo 기반 |

---

## 🧠 사용 기술 요약

| 분류 | 기술 / 오픈소스 | 역할 |
| --- | --- | --- |
| 챗봇 | Rasa, Okt | 사용자 발화 분석 및 레시피 추천 로직 |
| 백엔드 | Flask, SQLite | 회원 정보, 재료, 레시피 DB 관리 |
| 크롤링 | BeautifulSoup4 | 만개의 레시피에서 상세 조리법 수집 |
| 보안 | Werkzeug | 비밀번호 해시 처리 |
| 이메일 | smtplib | 임시 비밀번호 전송 |
| 프론트엔드 | React Native, Expo | 모바일 앱 개발 |

---

## 🔗 시스템 구성도

```
[React Native App]
     ↓ 사용자 입력 (재료/조건/계정)
[Flask Backend]
 ├── DB 관리 (SQLite)
 ├── API 처리 (회원가입, 로그인, 재료 관리 등)
 └── 🔐 비밀번호 해시 처리 (Werkzeug)
     ↕
[Rasa Chatbot]
 └── 사용자 발화 처리 및 레시피 추천 로직 (Okt + 레시피 데이터셋)
     ↕
[BeautifulSoup]
 └── 만개의 레시피 상세 정보 크롤링
```

---

## 🔍 사용 예시

```bash
💬 사용자: "양파랑 계란으로 10분 안에 만들 수 있는 요리 뭐 있을까?"
🤖 챗봇: 다음과 같은 레시피를 추천합니다!
1. 양파계란볶음 🍳
2. 초간단 계란찜 🥣
3. 양파전 🥘
```

---

## ⚙️ 개발 환경 설정 및 설치

### 1. Rasa 환경 설정

```bash
# Python 3.10 설치 후 아래 순서대로 진행
python -m venv rasaenv             # 가상 환경 생성
rasaenv\\Scripts\\activate           # (Windows) 가상 환경 활성화
# 또는 source rasaenv/bin/activate (Mac/Linux)

# 패키지 설치
pip install rasa rasa-sdk requests beautifulsoup4
```

### 2. Flask 백엔드 설정

```bash
# backend 폴더로 이동
cd backend

# Flask 앱 실행
python app.py
```

### 3. React Native 프론트엔드 설정

```bash
# Expo 초기 설정 및 필수 패키지 설치
npm install

# 📦 네비게이션 라이브러리 설치
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# 📦 앱 기능 라이브러리 설치 (상태관리, 폼 처리, API 요청 등)
npm install zustand react-hook-form axios

# 앱 실행 (모바일 또는 웹 브라우저)
npx expo start           # 기본 실행
npx expo start --web     # 웹 환경에서 실행
```

## 💻 프로젝트 실행 방법 (VSCode 기준)

> 터미널 총 5개 필요
> 

### ✅ 0. 준비: 가상환경 활성화

```bash
# 각 터미널마다 아래 명령 수행
rasaenv\Scripts\activate   # 또는 source rasaenv/bin/activate
```

### ✅ 1. 모델 학습 (NLU 학습)

```bash
cd chatbot_rasa
rasa train
```

### ✅ 2. 액션 서버 실행 (커스텀 액션 사용 시)

```bash
cd chatbot_rasa
rasa run actions
```

### ✅ 3. Rasa 서버 실행 (개발모드 + API 허용)

```bash
cd chatbot_rasa
rasa run --enable-api --cors "*" --debug
```

### ✅ 4. Flask 백엔드 실행 (DB 관리, 레시피 API)

```bash
cd backend
python app.py
```

### ✅ 5. React Native 앱 실행 (Expo 사용)

```bash
npm install
npx expo start          # QR 코드 스캔하여 앱 실행
# 웹에서 실행하려면: npx expo start --web
```

---

## 📦 주요 명령어 설명

| 명령어 | 설명 |
| --- | --- |
| `rasa run actions` | 액션 서버 실행. DB 조회, 외부 API 호출 등에 필수 |
| `rasa train` | Rasa 모델 학습 (NLU + 대화 정책 등) |
| `rasa shell` | CLI 기반 챗봇 테스트 |
| `rasa run --enable-api --cors "*"` | HTTP API로 챗봇 실행 가능하게 설정 |
| `Ctrl + C` | 실행 중인 서버/프로세스 종료 |

---


## 📄 라이선스 정보

MIT License © 2025 ByteBite Team

---

## 👥 개발

- **팀명**: ByteBite (단국대학교 소프트웨어융합대학)
- **주 개발자**: 노승아, 박지민, 주희진

---

## 📚 참고 문서

- [Rasa 공식 문서](https://rasa.com/docs/)
- [BeautifulSoup 문서](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [KoNLPy Okt 문서](https://konlpy.org/ko/latest/)
- [Werkzeug Security](https://werkzeug.palletsprojects.com/)
- [React Native 공식](https://reactnative.dev/)
- [Flask 공식 문서](https://flask.palletsprojects.com/)

---

> ByteBite는 여러분의 냉장고 속 재료를 요리로 바꾸는 마법사입니다.
> 
> 
> 직접 사용해보세요! 🍽️
>
