import { Injectable } from '@nestjs/common';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

@Injectable()
export class AwsService {
  private ssmClient: SSMClient;

  constructor() {
    this.ssmClient = new SSMClient({
      region: process.env.AWS_REGION || 'ap-northeast-2', // 서울 리전
    });
  }

  async getParameter(
    name: string,
    withDecryption: boolean = true,
  ): Promise<string> {
    try {
      const command = new GetParameterCommand({
        Name: name,
        WithDecryption: withDecryption,
      });

      const response = await this.ssmClient.send(command);
      return response.Parameter?.Value || '';
    } catch (error) {
      console.error(`Failed to get parameter ${name}:`, error);
      throw new Error(`Parameter ${name} not found`);
    }
  }

  async getMultipleParameters(
    names: string[],
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    for (const name of names) {
      try {
        results[name] = await this.getParameter(name);
      } catch (error) {
        console.error(`Failed to get parameter ${name}:`, error);
        results[name] = '';
      }
    }

    return results;
  }
}
