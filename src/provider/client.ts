import { Injectable } from '@nestjs/common';
import { This } from '@vodyani/class-decorator';
import { AxiosError } from '@vodyani/http-client';

import { ApolloClientOptions, NamespaceType, ObserverInfo } from '../common';
import { ApolloHttpClient, ApolloScheduler } from '../struct';

@Injectable()
export class ApolloClientProvider {
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
      this.throwError(error);
    }
  }

  @This
  public async getConfigByCache(namespace: string, type: NamespaceType, ip?: string) {
    try {
      const result = await this.httpClient.getConfigByCache(namespace, type, ip);
      return result;
    } catch (error) {
      this.throwError(error);
    }
  }

  @This
  public async listenNamespaces(infos: ObserverInfo[]) {
    this.checkNamespace(infos);
    await this.scheduler.deploy(infos);
  }

  @This
  public closeAllListener() {
    this.scheduler.close();
  }

  @This
  public clearListener(namespace: string) {
    this.scheduler.clear(namespace);
  }

  @This
  private checkNamespace(infos: ObserverInfo[]) {
    const set = new Set();

    for (const { namespace } of infos) {
      if (set.has(namespace)) {
        throw new Error('Incorrect request, namespace is duplication!');
      } else {
        set.add(namespace);
      }
    }
  }

  @This
  private throwError(error: AxiosError) {
    if (error.response.status === 401) {
      throw new Error('Incorrect request, please check appId or secret!');
    }

    throw new Error('Incorrect request, please check parameters!');
  }
}
