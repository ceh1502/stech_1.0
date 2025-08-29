import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../src/schemas/player.schema';
import { getModelToken } from '@nestjs/mongoose';

async function fixDuplicatePlayers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const playerModel = app.get<Model<PlayerDocument>>(getModelToken(Player.name));

  console.log('🔍 중복 선수 데이터 검사 시작...');

  // 팀명 + 등번호가 같은 선수들 찾기
  const duplicates = await playerModel.aggregate([
    {
      $group: {
        _id: { teamName: '$teamName', jerseyNumber: '$jerseyNumber' },
        count: { $sum: 1 },
        docs: { $push: '$$ROOT' }
      }
    },
    {
      $match: { count: { $gt: 1 } }
    }
  ]);

  console.log(`📊 중복 그룹 ${duplicates.length}개 발견`);

  for (const duplicate of duplicates) {
    const { teamName, jerseyNumber } = duplicate._id;
    const docs = duplicate.docs;
    
    console.log(`\n🔍 ${teamName} #${jerseyNumber} - ${docs.length}개 중복`);
    
    // 포지션별로 분류
    const positionGroups: { [position: string]: any[] } = {};
    docs.forEach(doc => {
      if (!positionGroups[doc.position]) {
        positionGroups[doc.position] = [];
      }
      positionGroups[doc.position].push(doc);
    });

    console.log(`   포지션: ${Object.keys(positionGroups).join(', ')}`);

    // K 포지션이 있으면 우선 유지, 나머지는 삭제
    let keepDoc = null;
    if (positionGroups['K']) {
      keepDoc = positionGroups['K'][0];
      console.log(`   ✅ 키커로 유지: ${keepDoc.name}`);
    } else {
      // 키커가 없으면 첫 번째 문서 유지
      keepDoc = docs[0];
      console.log(`   ✅ 첫 번째로 유지: ${keepDoc.name} (${keepDoc.position})`);
    }

    // 나머지 중복 문서들 삭제
    const toDelete = docs.filter(doc => doc._id.toString() !== keepDoc._id.toString());
    
    for (const doc of toDelete) {
      console.log(`   🗑️ 삭제: ${doc.name} (${doc.position})`);
      await playerModel.deleteOne({ _id: doc._id });
    }
  }

  console.log('\n✅ 중복 선수 정리 완료');
  await app.close();
}

if (require.main === module) {
  fixDuplicatePlayers().catch(console.error);
}