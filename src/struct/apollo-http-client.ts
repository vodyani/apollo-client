import { This } from '@vodyani/class-decorator';
import { IConfigSubscriber } from '@vodyani/core';
import { AgentKeepAlive, HttpClient } from '@vodyani/http-client';
import { isValidArray, sleep, toNumber } from '@vodyani/utils';

import {
  ApolloHttpClientOptions,
  ApolloNotificationOptions,
  ApolloObserverInfo,
  ApolloThirdPartyHttpClientOptions,
  NamespaceType,
} from '../common';
import { generateNamespace, transformContent, transformNamespace } from '../method';

import { ApolloConfigSigner } from './apollo-config-signer';

export class ApolloHttpClient {
  private readonly httpClient = new HttpClient();

  private readonly infos = new Map<string, ApolloObserverInfo>();

  private readonly subscribers = new Map<string, IConfigSubscriber>();

  private readonly httpAgent = new AgentKeepAlive({ keepAlive: true });

  constructor(
    private readonly options: ApolloHttpClientOptions,
  ) {
    this.options.clusterName = this.options.clusterName || 'default';
  }

  @This
  public async getConfig(namespace: string, type: NamespaceType, ip?: string): Promise<Record<string, any>> {
    const { appId, clusterName, configServerUrl } = this.options;

    let url = configServerUrl;
    url += `/configs/${appId}/${clusterName}`;
    url += `/${generateNamespace(namespace, type)}`;

    const result = await this.httpClient.get(
      url,
      {
        headers: this.generateHeaders(url),
        httpAgent: this.httpAgent,
        timeout: 15000,
        params: { ip },
      },
    );

    return transformContent(result.data.configurations, type);
  }

  @This
  public async getConfigByCache(namespace: string, type: NamespaceType, ip?: string): Promise<Record<string, any>> {
    const { appId, clusterName, configServerUrl } = this.options;

    let url = configServerUrl;
    url += `/configfiles/json/${appId}/${clusterName}`;
    url += `/${generateNamespace(namespace, type)}`;

    const result = await this.httpClient.get(
      url,
      {
        headers: this.generateHeaders(url),
        httpAgent: this.httpAgent,
        timeout: 15000,
        params: { ip },
      },
    );

    return transformContent(result.data, type);
  }

  @This
  public subscribe(info: ApolloObserverInfo, subscriber: IConfigSubscriber) {
    const namespaceName = generateNamespace(info.namespace, info.type);

    this.subscribers.set(namespaceName, subscriber);
    this.infos.set(namespaceName, { ...info, id: 1 });
  }

  @This
  public unSubscribe(namespace: string, type: NamespaceType) {
    const namespaceName = generateNamespace(namespace, type);

    this.subscribers.delete(namespaceName);
    this.infos.delete(namespaceName);
  }

  @This
  public async polling(retry?: number, delay?: number) {
    let errorCount = 0;
    const retryCount = toNumber(retry, 4);
    const delayCount = toNumber(delay, 1000);

    while (this.infos.size > 0) {
      try {
        await this.sync();
      } catch (err) {
        errorCount++;

        if (errorCount > retryCount) {
          throw new Error('Incorrect polling, please check appId of secret!');
        } else {
          await sleep(delayCount);
        }
      }
    }
  }

  @This
  public unPolling() {
    this.infos.clear();
  }

  @This
  private notify(namespace: string, type: NamespaceType, value: any) {
    const namespaceName = generateNamespace(namespace, type);
    const subscriber = this.subscribers.get(namespaceName);

    if (subscriber) {
      subscriber.update(namespaceName, value);
    }
  }

  @This
  private async getConfigNotifications(infos: ApolloObserverInfo[]) {
    const { appId, clusterName, configServerUrl } = this.options;

    const notifications = infos.map(({ namespace, id, type }) => ({
      notificationId: id,
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
  private async sync() {
    if (this.infos.size > 0) {
      const notifications: ApolloObserverInfo[] = [];

      this.infos.forEach(e => notifications.push(e));

      const result = await this.getConfigNotifications(notifications);

      if (isValidArray(result)) {
        for (const notification of result) {
          const { namespaceName, notificationId } = notification;
          const namespace = transformNamespace(namespaceName);
          const observerInfo = this.infos.get(namespaceName);

          if (observerInfo) {
            const { id, type, ip } = observerInfo;

            observerInfo.id = notificationId;

            if (id !== 1) {
              const config = await this.getConfig(namespace, type, ip);

              this.notify(namespace, type, config);
            }
          }
        }
      }
    }
  }

  @This
  private generateHeaders(url: string) {
    const { appId, secret } = this.options;

    return secret
      ? new ApolloConfigSigner(appId, secret).signature(url)
      : Object();
  }
}

export class ApolloThirdPartyHttpClient {
  private readonly httpBasePath: string;

  private readonly httpClient: HttpClient;

  private readonly httpAgent = new AgentKeepAlive({ keepAlive: true });

  constructor(
    private readonly options: ApolloThirdPartyHttpClientOptions,
  ) {
    const { appId, clusterName, env, token, portalServerUrl } = options;

    this.httpClient = new HttpClient({
      baseURL: portalServerUrl,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json;charset=UTF-8',
      },
    });

    this.httpBasePath = `/openapi/v1/envs/${env}/apps/`;
    this.httpBasePath += `${appId}/clusters/${clusterName || 'default'}/namespaces/`;
  }

  @This
  public async getConfig(namespace: string, type: NamespaceType, key = 'content') {
    const namespaceName = generateNamespace(namespace, type);
    const url = `${this.httpBasePath}${namespaceName}/items/${key}`;

    const result = await this.httpClient.get(
      url,
      {
        timeout: 15000,
        httpAgent: this.httpAgent,
      },
    );

    return transformContent(result.data.value, type);
  }

  @This
  public async saveConfig(namespace: string, type: NamespaceType, value: string, key = 'content') {
    const namespaceName = generateNamespace(namespace, type);
    const url = `${this.httpBasePath}${namespaceName}/items/${key}`;

    await this.httpClient.put(
      url,
      {
        timeout: 15000,
        httpAgent: this.httpAgent,
        params: { createIfNotExists: true },
        data: {
          key,
          value,
          dataChangeCreatedBy: this.options.operator,
          dataChangeLastModifiedBy: this.options.operator,
        },
      },
    );

    await this.publishConfig(namespace, type);
  }

  @This
  public async deleteConfig(namespace: string, type: NamespaceType, key = 'content') {
    const namespaceName = generateNamespace(namespace, type);
    const url = `${this.httpBasePath}${namespaceName}/items/${key}`;

    await this.httpClient.delete(
      url,
      {
        timeout: 15000,
        httpAgent: this.httpAgent,
        params: { key, operator: this.options.operator },
      },
    );

    await this.publishConfig(namespace, type);
  }

  @This
  private async publishConfig(namespace: string, type: NamespaceType) {
    const namespaceName = generateNamespace(namespace, type);
    const url = `${this.httpBasePath}${namespaceName}/releases`;

    await this.httpClient.post(
      url,
      {
        timeout: 15000,
        httpAgent: this.httpAgent,
        data: {
          releaseTitle: `release-${this.options.appId}-${namespace}-${Date.now()}`,
          releasedBy: this.options.operator,
        },
      },
    );
  }
}
