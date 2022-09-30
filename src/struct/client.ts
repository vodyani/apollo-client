import { This } from '@vodyani/class-decorator';
import { AgentKeepAlive, HttpClient } from '@vodyani/http-client';

import {
  ApolloClientOptions,
  ApolloLongPollingInfo,
  ApolloNotificationOptions,
  NamespaceType,
} from '../common';

import { HeaderSigner } from './header-signer';

export class ApolloHttpClient {
  private readonly httpClient: HttpClient;

  private readonly httpAgent = new AgentKeepAlive({ keepAlive: true });

  constructor(
    private readonly options: ApolloClientOptions,
  ) {
    this.httpClient = new HttpClient();
    this.options.clusterName = this.options.clusterName || 'default';
  }

  @This
  public async getConfig(namespace: string, type: NamespaceType, ip?: string): Promise<Record<string, any>> {
    const { appId, clusterName, configServerUrl } = this.options;

    let url = configServerUrl;
    url += `/configs/${appId}/${clusterName}`;
    url += `/${this.generateNamespace(namespace, type)}`;

    const result = await this.httpClient.get(
      url,
      {
        headers: this.generateHeaders(url),
        httpAgent: this.httpAgent,
        timeout: 15000,
        params: { ip },
      },
    );

    return this.generateContent(result.data.configurations, type);
  }

  @This
  public async getConfigByCache(namespace: string, type: NamespaceType, ip?: string): Promise<Record<string, any>> {
    const { appId, clusterName, configServerUrl } = this.options;

    let url = configServerUrl;
    url += `/configfiles/json/${appId}/${clusterName}`;
    url += `/${this.generateNamespace(namespace, type)}`;

    const result = await this.httpClient.get(
      url,
      {
        headers: this.generateHeaders(url),
        httpAgent: this.httpAgent,
        timeout: 15000,
        params: { ip },
      },
    );

    return this.generateContent(result.data, type);
  }

  @This
  public async getConfigNotifications(infos: ApolloNotificationOptions[]) {
    const { appId, clusterName, configServerUrl } = this.options;

    const realInfos: ApolloLongPollingInfo[] = infos
      .map(({ namespaceName, notificationId, type }) => ({
        notificationId,
        namespaceName: this.generateNamespace(namespaceName, type),
      }));

    let url = configServerUrl;
    url += `/notifications/v2?appId=${appId}&cluster=${clusterName}`;
    url += `&notifications=${JSON.stringify(realInfos)}`;
    url = encodeURI(url);

    const result = await this.httpClient.get(
      url,
      {
        headers: this.generateHeaders(url),
        httpAgent: this.httpAgent,
        timeout: 650000,
      },
    );

    return result.data as ApolloLongPollingInfo[];
  }

  @This
  private generateHeaders(url: string) {
    const { appId, secret } = this.options;
    return secret ? new HeaderSigner(appId, secret).signature(url) : Object();
  }

  @This
  private generateContent(data: Record<string, any>, type: NamespaceType) {
    return type === 'json' ? JSON.parse(data.content) : data;
  }

  @This
  private generateNamespace(namespace: string, type: NamespaceType) {
    return type === 'json' ? `${namespace}.json` : namespace;
  }
}
