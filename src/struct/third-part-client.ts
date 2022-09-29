import { This } from '@vodyani/class-decorator';
import { AgentKeepAlive, HttpClient } from '@vodyani/http-client';

import {
  ApolloThirdPartyClientOptions,
  NamespaceType,
} from '../common';

export class ApolloThirdPartyHttpClient {
  private readonly httpBasePath: string;

  private readonly httpClient: HttpClient;

  private readonly httpAgent = new AgentKeepAlive({ keepAlive: true });

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

    this.httpBasePath = `/openapi/v1/envs/${env}/apps/`;
    this.httpBasePath += `${appId}/clusters/${clusters || 'default'}/namespaces/`;
  }

  @This
  public async getConfig(namespace: string, type: NamespaceType, key = 'content') {
    const namespaceName = this.generateNamespace(namespace, type);
    const url = `${this.httpBasePath}${namespaceName}/items/${key}`;

    const result = await this.httpClient.get(
      url,
      {
        timeout: 15000,
        httpAgent: this.httpAgent,
      },
    );

    return this.generateContent(result.data.value, type);
  }

  @This
  public async saveConfig(namespace: string, type: NamespaceType, value: string, key = 'content') {
    const namespaceName = this.generateNamespace(namespace, type);
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
  }

  @This
  public async deleteConfig(namespace: string, type: NamespaceType, key = 'content') {
    const namespaceName = this.generateNamespace(namespace, type);
    const url = `${this.httpBasePath}${namespaceName}/items/${key}`;

    await this.httpClient.delete(
      url,
      {
        timeout: 15000,
        httpAgent: this.httpAgent,
        params: { key, operator: this.options.operator },
      },
    );
  }

  @This
  public async publishConfig(namespace: string, type: NamespaceType) {
    const namespaceName = this.generateNamespace(namespace, type);
    const url = `${this.httpBasePath}${namespaceName}/releases`;

    await this.httpClient.post(
      url,
      {
        timeout: 15000,
        httpAgent: this.httpAgent,
        data: {
          releaseTitle: `release-${this.options.appId}-${Date.now()}`,
          releasedBy: this.options.operator,
        },
      },
    );
  }

  @This
  private generateContent(data: any, type: NamespaceType) {
    return type === 'json' ? JSON.parse(data) : data;
  }

  @This
  private generateNamespace(namespace: string, type: NamespaceType) {
    return type === 'json' ? `${namespace}.json` : namespace;
  }
}
