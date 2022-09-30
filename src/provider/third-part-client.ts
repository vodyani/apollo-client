import { Injectable } from '@nestjs/common';
import { This } from '@vodyani/class-decorator';
import { AxiosError } from '@vodyani/http-client';

import { ApolloThirdPartyClientOptions, NamespaceType } from '../common';
import { ApolloThirdPartyHttpClient } from '../struct';

@Injectable()
export class ApolloThirdPartClientProvider {
  private readonly httpClient: ApolloThirdPartyHttpClient;
  constructor(
    private readonly options: ApolloThirdPartyClientOptions,
  ) {
    this.httpClient = new ApolloThirdPartyHttpClient(options);
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
  public async saveConfig(namespace: string, type: NamespaceType, value: string, key?: string) {
    try {
      await this.httpClient.saveConfig(namespace, type, value, key);
    } catch (error) {
      this.throwError(error);
    }

    await this.httpClient.publishConfig(namespace, type);
  }

  @This
  public async deleteConfig(namespace: string, type: NamespaceType, key?: string) {
    try {
      await this.httpClient.deleteConfig(namespace, type, key);
    } catch (error) {
      this.throwError(error);
    }

    await this.httpClient.publishConfig(namespace, type);
  }

  @This
  private throwError(error: AxiosError) {
    if (error.response.status === 401) {
      throw new Error('Incorrect request, please check appId or token!');
    }

    throw new Error('Incorrect request, please check parameters!');
  }
}
