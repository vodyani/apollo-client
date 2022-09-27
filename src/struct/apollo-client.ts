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
    return this.httpClient.getConfig(namespace, type, ip);
  }

  @This
  public async getConfigByCache(namespace: string, type: NamespaceType, ip?: string) {
    return this.httpClient.getConfigByCache(namespace, type, ip);
  }

  @This
  public async listenNamespaces(infos: ObserverInfo[]) {
    this.scheduler.listen(infos);
  }

  @This
  public async closeListener() {
    this.scheduler.close();
  }

  @This
  public async clearListener(namespace: string) {
    this.scheduler.clear(namespace);
  }
}
