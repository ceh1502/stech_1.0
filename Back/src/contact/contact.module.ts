import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [AwsModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}

// 5. app.module.ts 수정
import { Module } from '@nestjs/common';
import { ContactModule } from './contact/contact.module';
import { AwsModule } from './aws/aws.module';

@Module({
  imports: [
    AwsModule,
    ContactModule,
    // 기존 imports...
  ],
  // 기존 내용...
})
export class AppModule {}
