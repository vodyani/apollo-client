import { This } from '@vodyani/class-decorator';
import { AgentKeepAlive, AxiosRequestConfig, HttpClient } from '@vodyani/http-client';
import { toNumber } from '@vodyani/utils';

import { ApolloHttpClientOptions, ApolloNotificationOptions, ApolloObserverInfo, NamespaceType } from '../common';
import { generateNamespace, transformContent } from '../method';

import { ApolloHttpClientSigner } from './apollo-http-client-signer';

export class ApolloHttpClient {
  private readonly httpClient = new HttpClient();

  private readonly httpAgent = new AgentKeepAlive({ keepAlive: true });

  constructor(
    private readonly options: ApolloHttpClientOptions,
  ) {
    this.options.clusterName = this.options.clusterName || 'default';
  }

  @This
  public async getConfig(namespace: string, type: NamespaceType): Promise<Record<string, any>> {
    const { appId, clusterName, configServerUrl } = this.options;

    let url = configServerUrl;
    url += `/configs/${appId}/${clusterName}`;
    url += `/${generateNamespace(namespace, type)}`;

    const result = await this.httpClient.get(
      url,
      this.generateRequestOptions(url),
    );

    return transformContent(result.data.configurations, type);
  }

  @This
  public async getConfigByCache(namespace: string, type: NamespaceType): Promise<Record<string, any>> {
    const { appId, clusterName, configServerUrl } = this.options;

    let url = configServerUrl;
    url += `/configfiles/json/${appId}/${clusterName}`;
    url += `/${generateNamespace(namespace, type)}`;

    const result = await this.httpClient.get(
      url,
      this.generateRequestOptions(url),
    );

    return transformContent(result.data, type);
  }

  @This
  public async getConfigNotifications(infos: ApolloObserverInfo[]) {
    const { appId, clusterName, configServerUrl } = this.options;

    const notifications = infos.map(({ namespace, id, type }) => ({
      notificationId: toNumber(id, 1),
      namespaceName: generateNamespace(namespace, type),
    }));

    let url = configServerUrl;
    url += `/notifications/v2?appId=${appId}&cluster=${clusterName}`;
    url += `&notifications=${JSON.stringify(notifications)}`;
    url = encodeURI(url);

    const result = await this.httpClient.get(
      url,
      {
        headers: this.generateHeaders(url),
        httpAgent: this.httpAgent,
        timeout: 650000,
      },
    );

    return result.data as ApolloNotificationOptions[];
  }

  @This
  private generateRequestOptions(url: string) {
    const options: AxiosRequestConfig = {
      headers: this.generateHeaders(url),
      httpAgent: this.httpAgent,
      timeout: 15000,
    };

    if (this.options.currentIp) {
      options.params.ip = this.options.currentIp;
    }

    return options;
  }

  @This
  private generateHeaders(url: string) {
    const { appId, secret } = this.options;

    return secret
      ? new ApolloHttpClientSigner(appId, secret).signature(url)
      : Object();
  }
}
