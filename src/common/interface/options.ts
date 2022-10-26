import { NamespaceType } from '../type';

import { IApolloConfigMapper } from './client';

export interface ApolloHttpClientOptions {
  appId: string;
  clusterName?: string;
  configServerUrl: string
  secret?: string;
  currentIp?: string;
}

export interface ApolloThirdPartyHttpClientOptions {
  appId: string;
  clusterName?: string;
  env: string;
  portalServerUrl: string
  token: string;
  operator: string;
}

export interface ApolloClientBuildOptions {
  clientOptions: ApolloHttpClientOptions;
  clientMapper?: IApolloConfigMapper;
  clientPollRetry?: number;
  clientPollDelay?: number;
}

export interface ApolloNotificationOptions {
  namespaceName: string;
  notificationId: number;
}

export interface ApolloObserverOptions {
  namespace: string;
  type: NamespaceType;
}

export interface ApolloObserverInfo extends ApolloObserverOptions {
  id?: number;
}
