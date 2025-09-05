async onModuleInit() {
  try {
    // AWS Parameter Store 시도
    const [slackToken, channelId] = await Promise.all([
      this.awsService.getParameter('/stechpro/slack-bot-token'),
      this.awsService.getParameter('/stechpro/slack-contact-channel'),
    ]);
    
    this.slack = new WebClient(slackToken);
    this.contactChannel = channelId;
    console.log('AWS Parameter Store에서 Slack 설정 로드 성공');
  } catch (error) {
    console.log('AWS Parameter Store 접근 실패, 환경변수 사용:', error.message);
    
    // 환경변수 폴백
    const token = process.env.SLACK_BOT_TOKEN;
    const channel = process.env.SLACK_CONTACT_CHANNEL;
    
    if (!token || !channel) {
      throw new Error('Slack 설정이 없습니다. SLACK_BOT_TOKEN과 SLACK_CONTACT_CHANNEL을 확인하세요.');
    }
    
    this.slack = new WebClient(token);
    this.contactChannel = channel;
    console.log('환경변수에서 Slack 설정 로드 성공');
  }
}