import { This } from '@vodyani/class-decorator';
import { HttpClient, AgentKeepAlive } from '@vodyani/http-client';

import { ApolloThirdPartyHttpClientOptions, NamespaceType } from '../common';
import { generateNamespace, transformContent } from '../method';

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
