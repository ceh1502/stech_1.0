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
