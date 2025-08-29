import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../src/schemas/player.schema';
import { getModelToken } from '@nestjs/mongoose';

async function fixIndexes() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const playerModel = app.get<Model<PlayerDocument>>(getModelToken(Player.name));

  console.log('🔍 현재 인덱스 확인...');
  
  // 현재 인덱스 보기
  const indexes = await playerModel.collection.getIndexes();
  console.log('현재 인덱스:', Object.keys(indexes));
  
  try {
    // 문제가 되는 인덱스 삭제 시도
    console.log('🗑️ 기존 중복 인덱스 삭제 시도...');
    try {
      await playerModel.collection.dropIndex('teamName_1_jerseyNumber_1');
      console.log('✅ teamName_1_jerseyNumber_1 인덱스 삭제됨');
    } catch (e) {
      console.log('⚠️ teamName_1_jerseyNumber_1 인덱스가 존재하지 않음');
    }

    // 새 인덱스 생성
    console.log('🆕 새 인덱스 생성...');
    await playerModel.collection.createIndex(
      { teamName: 1, jerseyNumber: 1, position: 1 }, 
      { unique: true }
    );
    console.log('✅ 새 유니크 인덱스 생성: teamName + jerseyNumber + position');
    
  } catch (error) {
    console.error('❌ 인덱스 수정 실패:', error.message);
  }

  await app.close();
}

if (require.main === module) {
  fixIndexes().catch(console.error);
}