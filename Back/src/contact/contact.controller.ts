import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact.dto';

@Controller('api')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('contact')
  async submitContact(@Body() contactDto: ContactDto) {
    try {
      // 입력 데이터 검증
      if (
        !contactDto.fullName ||
        !contactDto.email ||
        !contactDto.reason ||
        !contactDto.message
      ) {
        throw new HttpException(
          '모든 필드를 입력해주세요.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactDto.email)) {
        throw new HttpException(
          '올바른 이메일 형식이 아닙니다.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.contactService.processContact(contactDto);

      return {
        success: true,
        message: '문의가 성공적으로 접수되었습니다.',
        contactId: result.contactId,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Contact form error:', error);
      throw new HttpException(
        '문의 처리 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
