import * as crypto from 'crypto';
import { URL } from 'url';

export class ApolloHttpClientSigner {
  constructor(
    private readonly appId: string,
    private readonly secret: string,
  ) {}

  public signature(url: string) {
    const timestamp = new Date().getTime();
    const token = this.createHmac(timestamp, url);

    return {
      'Timestamp': timestamp,
      'Authorization': `Apollo ${this.appId}:${token}`,
    };
  }

  private createHmac(timestamp: number, url: string): string {
    return crypto
      .createHmac('sha1', this.secret)
      .update(`${timestamp}\n${this.createUrl(url)}`)
      .digest('base64');
  }

  private createUrl(url: string): string {
    const { pathname, search } = new URL(url);
    return `${pathname}${search}`;
  }
}
