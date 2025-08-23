import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정 (개발 환경에서는 모든 origin 허용)
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL, 'http://3.34.47.22:3000']
      : true, // 개발 환경에서는 모든 origin 허용
    credentials: true,
  }));

  // 보안 미들웨어 (Swagger UI를 위한 설정 추가)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
      },
    },
  }));

  // 글로벌 파이프 설정
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  // API 접두사 설정
  app.setGlobalPrefix('api');

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('🏈 STECH Pro API')
    .setDescription(`
미식축구 전문 플랫폼의 종합 스탯 분석 API

## 📋 주요 기능
- **선수 관리**: 선수 생성, 조회, 업데이트
- **포지션별 스탯 분석**: 10개 포지션 지원 (QB, RB, WR, TE, Kicker, Punter, OL, DL, LB, DB)
- **클립 데이터 분석**: 자동 스탯 계산 및 저장
- **랭킹 시스템**: 포지션별, 스탯별 랭킹 조회
- **팀 관리**: 팀별 선수 관리

## 🎯 지원 포지션
1. **QB (쿼터백)** - 14개 스탯
2. **RB (러닝백)** - 22개 스탯
3. **WR (와이드 리시버)** - 22개 스탯 (리턴 포함)
4. **TE (타이트 엔드)** - 15개 스탯 (리턴 제외)
5. **Kicker** - 18개 스탯
6. **Punter** - 7개 스탯
7. **OL (오펜시브 라인맨)** - 4개 스탯
8. **DL (디펜시브 라인맨)** - 10개 스탯
9. **LB (라인백커)** - 10개 스탯
10. **DB (디펜시브 백)** - 10개 스탯

## 🔑 인증
Bearer Token을 사용한 JWT 인증이 필요한 일부 엔드포인트가 있습니다.
`)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT 토큰을 입력하세요',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', '인증 관련 API')
    .addTag('Player', '선수 관련 API')
    .addTag('Team', '팀 관련 API')
    .addTag('Video', '비디오 관련 API')
    .addServer('http://localhost:4000', '개발 서버')
    .addServer('https://api.stech.pro', '운영 서버')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  // 두 경로 모두에서 Swagger 접근 가능하도록 설정
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'STECH Pro API 문서',
    customfavIcon: '🏈',
    customCss: `
      .topbar-wrapper img {content:url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Ctext y="18" font-size="18"%3E🏈%3C/text%3E%3C/svg%3E'); width:40px; height:auto;}
      .swagger-ui .topbar { background-color: #1f2937; }
      .swagger-ui .info .title { color: #f59e0b; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  });

  const port = process.env.PORT || 3001;
  
  // Vercel에서는 serverless function으로 실행되므로 포트 바인딩이 다름
  if (process.env.NODE_ENV === 'production') {
    await app.init();
    console.log('🚀 NestJS 서버가 Vercel에서 실행 준비 완료');
    return app;
  } else {
    await app.listen(port);
    console.log(`🚀 NestJS 서버가 http://localhost:${port}에서 실행 중입니다.`);
    console.log(`📚 Swagger 문서: http://localhost:${port}/api`);
    return app;
  }
}

// Vercel Serverless용 export
export default async function handler(req: any, res: any) {
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
}

// 로컬 개발 환경에서만 실행
if (require.main === module) {
  bootstrap();
}
