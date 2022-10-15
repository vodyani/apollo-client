import { NamespaceType } from '../type';

import { IApolloConfigMapper } from './client';

export interface ApolloHttpClientOptions {
  appId: string;
  clusterName?: string;
  configServerUrl: string
  secret?: string;
}

export interface ApolloClientBuildOptions {
  configEnv: string;
  configFilePath: string;
  configFileType: 'json' | 'yaml';
  configMapper?: IApolloConfigMapper;
  clientPollRetry?: number;
  clientPollDelay?: number;
  clientOptions: ApolloHttpClientOptions;
}

export interface ApolloThirdPartyHttpClientOptions {
  appId: string;
  clusterName?: string;
  env: string;
  portalServerUrl: string
  token: string;
  operator: string;
}

export interface ApolloNotificationOptions {
  namespaceName: string;
  notificationId: number;
}

export interface ApolloObserverOptions {
  namespace: string;
  type: NamespaceType;
  ip?: string;
}

export interface ApolloObserverInfo extends ApolloObserverOptions {
  id?: number;
}
