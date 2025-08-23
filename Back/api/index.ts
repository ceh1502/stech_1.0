import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import helmet from 'helmet';
import cors from 'cors';

let app: any;

export default async function handler(req: any, res: any) {
  if (!app) {
    app = await NestFactory.create(AppModule);
    
    // CORS 설정
    app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, 'http://3.34.47.22:3000']
        : true,
      credentials: true,
    }));

    // 보안 미들웨어
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

    await app.init();
  }
  
  return app.getHttpAdapter().getInstance()(req, res);
}