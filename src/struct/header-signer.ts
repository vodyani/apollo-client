import * as crypto from 'crypto';
import { URL } from 'url';

export class HeaderSigner {
  constructor(
    private readonly appId: string,
    private readonly secret: string,
  ) {}

  public signature(url: string) {
    const timestamp = new Date().getTime();
    const sign = this.create(timestamp, url);

    return {
      'Timestamp': timestamp,
      'Authorization': `Apollo ${this.appId}:${sign}`,
    };
  }

  private create(timestamp: number, url: string): string {
    return crypto
      .createHmac('sha1', this.secret)
      .update(`${timestamp}\n${this.urlSignature(url)}`)
      .digest('base64');
  }

  private urlSignature(url: string): string {
    const { pathname, search } = new URL(url);
    return `${pathname}${search}`;
  }
}
