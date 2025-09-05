import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async submitContact(@Body() body: any) {
    console.log('=== Contact API 호출됨 ===');
    console.log('받은 body:', body);
    console.log('body 타입:', typeof body);
    console.log('body keys:', Object.keys(body));

    try {
      const { fullName, email, reason, message } = body;

      if (!fullName || !email || !reason || !message) {
        console.log('유효성 검사 실패:', { fullName, email, reason, message });
        throw new HttpException(
          '모든 필드를 입력해주세요.',
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log('ContactService 호출 시작');
      const result = await this.contactService.processContact(body);
      console.log('ContactService 성공:', result);

      return {
        success: true,
        message: '문의가 성공적으로 접수되었습니다.',
        contactId: result.contactId,
      };
    } catch (error) {
      console.error('=== Contact Controller 에러 ===');
      console.error('에러:', error.message);

      throw new HttpException(
        '문의 처리 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
