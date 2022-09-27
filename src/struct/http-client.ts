import { This } from '@vodyani/class-decorator';
import { HttpClient } from '@vodyani/http-client';

import {
  ApolloClientOptions,
  ApolloLongPollingInfo,
  ApolloLongPollingOptions,
  ApolloThirdPartyClientOptions,
  NamespaceType,
} from '../common';

export class ApolloHttpClient {
  private readonly httpClient: HttpClient;

  constructor(
    private readonly options: ApolloClientOptions,
  ) {
    const { appId, configServerUrl, secret } = options;

    const config = Object({ baseURL: configServerUrl });

    if (secret) {
      config.headers = {
        'Timestamp': Date.now(),
        'Authorization': `Apollo ${appId}:${secret}`,
        'Content-Type': 'application/json;charset=UTF-8',
      };
    }

    this.httpClient = new HttpClient(config);
  }

  @This
  public async getConfig(namespace: string, type: NamespaceType, ip?: string): Promise<Record<string, any>> {
    const { appId, clusterName, configServerUrl } = this.options;
    const namespaceName = type === 'json' ? `${namespace}.json` : namespace;
    const url = `${configServerUrl}/configs/${appId}/${clusterName}/${namespaceName}`;

    const result = await this.httpClient.getData(
      url,
      { timeout: 15000, params: { ip }},
    );

    return result.configurations;
  }

  @This
  public async getConfigByCache(namespace: string, type: NamespaceType, ip?: string): Promise<Record<string, any>> {
    const { appId, clusterName, configServerUrl } = this.options;
    const namespaceName = type === 'json' ? `${namespace}.json` : namespace;
    const url = `${configServerUrl}/configfiles/json/${appId}/${clusterName}/${namespaceName}`;

    const result = await this.httpClient.getData(
      url,
      { timeout: 15000, params: { ip }},
    );

    return result;
  }

  @This
  public async longPolling(infos: ApolloLongPollingOptions[]) {
    const { appId, clusterName, configServerUrl } = this.options;
    const url = `${configServerUrl}/notifications/v2`;

    const realInfos: ApolloLongPollingInfo[] = infos.map(e => {
      const namespaceName = e.type === 'json' ? `${e.namespaceName}.json` : e.namespaceName;
      return { namespaceName, notificationId: e.notificationId };
    });

    const result = await this.httpClient.get(
      url,
      {
        timeout: 65000,
        params: {
          appId,
          cluster: clusterName,
          notifications: JSON.stringify(realInfos),
        },
      },
    );

    // no change ...
    if (result.status === 304) {
      return null;
    }

    return result.data as ApolloLongPollingInfo[];
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
