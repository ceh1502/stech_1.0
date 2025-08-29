# 환경 변수 설정 가이드

## 🔐 보안 주의사항

**중요**: `.env` 파일은 절대 Git 저장소에 커밋하지 마세요!

## 📝 설정 방법

1. `.env.example` 파일을 `.env`로 복사:
   ```bash
   cp .env.example .env
   ```

2. `.env` 파일에서 실제 값으로 교체:

### 필수 설정
- `JWT_SECRET`: 강력한 랜덤 문자열 (최소 32자)
- `MONGODB_URI`: MongoDB 연결 문자열

### 선택적 설정
- `EMAIL_USER`, `EMAIL_PASS`: 이메일 기능 사용시
- `AWS_*`: S3 파일 업로드 사용시

## 🛡️ 보안 팁

1. JWT_SECRET은 다음과 같이 생성하세요:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. 프로덕션에서는 MongoDB Atlas나 AWS DocumentDB 사용 권장

3. AWS 키는 최소 권한 원칙에 따라 S3 버킷에만 접근 가능하도록 설정

## 🚨 .env 파일이 GitHub에 업로드된 경우

1. 즉시 모든 민감한 정보(JWT secret, DB 비밀번호 등) 변경
2. Git 히스토리에서 완전 제거 필요
3. GitHub repository 설정에서 secrets으로 관리 권장