# Crew

Crew의 백엔드 레포입니다.

## 목차

- [소개](#소개)
- [설치](#설치)
- [API 엔드포인트](#api - 엔드포인트)

## 소개

Crew의 백엔드 코드입니다. 이 프로젝트는 함께하고 싶은 모임을 만들거나 참여할 수 있는 플랫폼 서비스입니다.

### 기술 스택

- 런타임: <code>Node.js</code>
- 프레임워크: <code>express</code>
- ORM: <code>Sequelize</code>
- 데이터베이스: <code>MySQL</code>
- 버전 관리 시스템: <code>Git</code>
- 외부 API: <code>kakao map</code>

## 설치

1. 레포 클론:

```bash
git clone https://github.com/CREW-service/BACK.git
```

2. 의존성 설치:

```bash
npm install
```

3. 환경변수 설정

4. 서버를 실행:

```bash
npm start
```

## API 엔드포인트

백엔드 서버에서 제공하는 API 엔드 포인트는 다음과 같습니다.

### User

- <code>GET</code> /user/signin → 사용자 로그인
- <code>GET</code> /user/logout → 사용자 로그아웃
- <code>GET</code> /user/mypage → 사용자 마이페이지

### Boat

- <code>POST</code> /boat/write → crew 모집 글 작성
- <code>GET</code> /boat/map → 맵을 통해 모집 글 목록 조회
- <code>GET</code> /boat/detail → crew 모집 글 상세 조회
- <code>PUT</code> /boat/:boatId → crew 모집 글 수정
- <code>PATCH</code> /boat/:boatId → crew 모집 글 비공개 처리
- <code>PATCH</code> /boat/:boatId → crew 모집 글 softDelete
