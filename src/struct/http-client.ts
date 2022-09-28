import { This } from '@vodyani/class-decorator';
import { AgentKeepAlive, HttpClient } from '@vodyani/http-client';

import {
  ApolloClientOptions,
  ApolloLongPollingInfo,
  ApolloNotificationOptions,
  ApolloThirdPartyClientOptions,
  NamespaceType,
} from '../common';

import { HeaderSigner } from './header-signer';

export class ApolloHttpClient {
  private readonly httpClient: HttpClient;

  private readonly httpAgent = new AgentKeepAlive({ 'keepAlive': true });

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

    return this.generateContent(result?.data?.configurations, type);
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

    return this.generateContent(result?.data, type);
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

    return result.status === 304 ? null : result?.data as ApolloLongPollingInfo[];
  }

  @This
  private generateHeaders(url: string) {
    let headers = Object();
    const { appId, secret } = this.options;

    if (secret) {
      const singer = new HeaderSigner(appId, secret);
      headers = singer.signature(url);
    }

    return headers;
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

export class ApolloThirdPartyHttpClient {
  private readonly httpBasePath: string;

  private readonly httpClient: HttpClient;

  private readonly httpAgent = new AgentKeepAlive({ 'keepAlive': true });

  constructor(
    private readonly options: ApolloThirdPartyClientOptions,
  ) {
    const { appId, clusters, env, token, portalServerUrl } = options;

    this.httpClient = new HttpClient({
      baseURL: portalServerUrl,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json;charset=UTF-8',
      },
    });

    this.httpBasePath = `/openapi/v1/envs/${env}/apps/${appId}/clusters/${clusters}/namespaces/`;
  }

  @This
  public async saveOrUpdate(namespace: string, type: NamespaceType, value: string, key: string) {
    const namespaceName = type === 'json' ? `${namespace}.json` : namespace;
    const url = `${this.httpBasePath}${namespaceName}/items/${key}`;

    await this.httpClient.put(
      url,
      {
        timeout: 15000,
        httpAgent: this.httpAgent,
        params: { createIfNotExists: true },
        data: { key, value, dataChangeLastModifiedBy: this.options.operator },
      },
    );

    await this.publish(namespaceName);
  }

  @This
  public async delete(namespace: string, type: NamespaceType, key: string) {
    const namespaceName = type === 'json' ? `${namespace}.json` : namespace;
    const url = `${this.httpBasePath}${namespaceName}/items/${key}`;

    await this.httpClient.delete(
      url,
      {
        timeout: 15000,
        httpAgent: this.httpAgent,
        params: { key, operator: this.options.operator },
      },
    );

    await this.publish(namespaceName);
  }

  @This
  private async publish(namespaceName: string) {
    const url = `${this.httpBasePath}${namespaceName}/releases`;

    await this.httpClient.post(
      url,
      {
        timeout: 15000,
        httpAgent: this.httpAgent,
        data: { releaseTitle: `release-${this.options.appId}-${Date.now()}`, releasedBy: this.options.operator },
      },
    );
  }
}
