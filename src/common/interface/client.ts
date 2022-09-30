import { NamespaceType } from '../type';

export interface ApolloLongPollingInfo {
  namespaceName: string;
  notificationId: number;
}

export interface ApolloNotificationOptions extends ApolloLongPollingInfo {
  type: NamespaceType;
}

export interface ApolloHttpClientOptions {
  appId: string;
  configServerUrl: string
  clusterName?: string;
  secret?: string;
}

export interface ApolloThirdPartyHttpClientOptions {
  appId: string;
  env: string;
  portalServerUrl: string
  token: string;
  clusters?: string;
  operator: string;
}

export interface ApolloClientOptions extends ApolloHttpClientOptions {
  retry?: number;
  delay?: number;
}
