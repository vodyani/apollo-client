import { This } from '@vodyani/class-decorator';

import { ApolloClientOptions, NamespaceType, ObserverInfo } from '../common';
import { ApolloHttpClient, ApolloScheduler } from '../struct';

export class ApolloClient {
  private readonly httpClient: ApolloHttpClient;

  private scheduler: ApolloScheduler;

  constructor(options: ApolloClientOptions) {
    this.httpClient = new ApolloHttpClient(options);
    this.scheduler = new ApolloScheduler(this.httpClient);
  }

  @This
  public async getConfig(namespace: string, type: NamespaceType, ip?: string) {
    try {
      const result = await this.httpClient.getConfig(namespace, type, ip);
      return result;
    } catch (error) {
      throw new Error('Incorrect request, please check parameters!');
    }
  }

  @This
  public async getConfigByCache(namespace: string, type: NamespaceType, ip?: string) {
    try {
      const result = await this.httpClient.getConfigByCache(namespace, type, ip);
      return result;
    } catch (error) {
      throw new Error('Incorrect request, please check parameters!');
    }
  }

  @This
  public async listenNamespaces(infos: ObserverInfo[]) {
    await this.scheduler.deploy(infos);
  }

  @This
  public async closeAllListener() {
    this.scheduler.close();
  }

  @This
  public async clearListener(namespace: string) {
    this.scheduler.clear(namespace);
  }
}
