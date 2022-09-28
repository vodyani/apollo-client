import { This } from '@vodyani/class-decorator';
import { HttpClient } from '@vodyani/http-client';

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

  constructor(
    private readonly options: ApolloClientOptions,
  ) {
    this.httpClient = new HttpClient();
    this.options.clusterName = this.options.clusterName || 'default';
  }

  @This
  public async getConfig(namespace: string, type: NamespaceType, ip?: string): Promise<Record<string, any>> {
    const { appId, clusterName, configServerUrl } = this.options;
    const namespaceName = this.generateNamespace(namespace, type);
    const url = `${configServerUrl}/configs/${appId}/${clusterName}/${namespaceName}`;

    const result = await this.httpClient.get(
      url,
      { headers: this.generateHeaders(url), timeout: 15000, params: { ip }},
    );

    return type === 'json' ? JSON.parse(result?.data?.configurations?.content) : result?.data?.configurations;
  }

  @This
  public async getConfigByCache(namespace: string, type: NamespaceType, ip?: string): Promise<Record<string, any>> {
    const { appId, clusterName, configServerUrl } = this.options;
    const namespaceName = this.generateNamespace(namespace, type);
    const url = `${configServerUrl}/configfiles/json/${appId}/${clusterName}/${namespaceName}`;

    const result = await this.httpClient.get(
      url,
      { headers: this.generateHeaders(url), timeout: 15000, params: { ip }},
    );

    return type === 'json' ? JSON.parse(result?.data?.content) : result?.data;
  }

  @This
  public async getConfigNotifications(infos: ApolloNotificationOptions[]) {
    const { appId, clusterName, configServerUrl } = this.options;

    const realInfos: ApolloLongPollingInfo[] = infos
      .map(({ namespaceName, notificationId, type }) => ({
        notificationId,
        namespaceName: this.generateNamespace(namespaceName, type),
      }));

    const url = encodeURI(
      `${configServerUrl}/notifications/v2?appId=${appId}&cluster=${clusterName}&notifications=${JSON.stringify(realInfos)}`,
    );

    const result = await this.httpClient.get(
      url,
      { headers: this.generateHeaders(url), timeout: 65000 },
    );

    return result.status === 304
      ? null
      : result?.data as ApolloLongPollingInfo[];
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
  private generateNamespace(namespace: string, type: NamespaceType) {
    return type === 'json' ? `${namespace}.json` : namespace;
  }
}

export class ApolloThirdPartyHttpClient {
  private readonly httpClient: HttpClient;
  private readonly httpBasePath: string;

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
        data: { releaseTitle: `release-${this.options.appId}-${Date.now()}`, releasedBy: this.options.operator },
      },
    );
  }
}
