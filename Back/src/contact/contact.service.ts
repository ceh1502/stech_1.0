import { Injectable, OnModuleInit } from '@nestjs/common';
import { WebClient } from '@slack/web-api';
import { ContactDto } from './dto/contact.dto';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class ContactService implements OnModuleInit {
  private slack: WebClient;
  private contactChannel: string;

  constructor(private readonly awsService: AwsService) {}

  async onModuleInit() {
    // 모듈 초기화 시 AWS Parameter Store에서 설정 로드
    try {
      const [slackToken, channelId] = await Promise.all([
        this.awsService.getParameter('/stechpro/slack-bot-token'),
        this.awsService.getParameter('/stechpro/slack-contact-channel'),
      ]);

      this.slack = new WebClient(slackToken);
      this.contactChannel = channelId;

      console.log('Slack 설정이 성공적으로 로드되었습니다.');
    } catch (error) {
      console.error('Slack 설정 로드 실패:', error);
      // 폴백으로 환경변수 사용
      this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
      this.contactChannel =
        process.env.SLACK_CONTACT_CHANNEL || '#contact-inquiries';
    }
  }

  async processContact(contactData: ContactDto) {
    if (!this.slack || !this.contactChannel) {
      throw new Error('Slack 설정이 초기화되지 않았습니다.');
    }

    try {
      const timestamp = contactData.timestamp || new Date().toISOString();
      const contactId = await this.saveContactData({
        ...contactData,
        timestamp,
        status: 'new',
      });

      const slackMessage = {
        channel: this.contactChannel,
        text: '새로운 문의가 접수되었습니다!',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📬 새로운 Contact 문의',
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*이름:*\n${contactData.fullName}`,
              },
              {
                type: 'mrkdwn',
                text: `*이메일:*\n${contactData.email}`,
              },
              {
                type: 'mrkdwn',
                text: `*접수 시간:*\n${new Date(timestamp).toLocaleString('ko-KR')}`,
              },
              {
                type: 'mrkdwn',
                text: `*문의 ID:*\n${contactId}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*문의 이유:*\n\`\`\`${contactData.reason}\`\`\``,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*문의 내용:*\n\`\`\`${contactData.message}\`\`\``,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '✅ 처리 완료',
                },
                style: 'primary',
                value: `complete_${contactId}`,
                action_id: 'complete_contact',
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '📧 이메일 답변',
                },
                style: 'default',
                value: `reply_${contactId}`,
                action_id: 'reply_contact',
                url: `mailto:${contactData.email}?subject=Re: StechPro 문의&body=안녕하세요 ${contactData.fullName}님,%0D%0A%0D%0A문의해주셔서 감사합니다.%0D%0A%0D%0A`,
              },
            ],
          },
        ],
      };

      const result = await this.slack.chat.postMessage(slackMessage);

      if (!result.ok) {
        throw new Error('Slack 메시지 전송 실패');
      }

      return { contactId };
    } catch (error) {
      console.error('Contact service error:', error);
      throw error;
    }
  }

  private async saveContactData(contactData: any): Promise<string> {
    return 'CONTACT_' + Date.now();
  }
}
