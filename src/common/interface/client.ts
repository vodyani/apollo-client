import { NamespaceType } from '../type';

export interface ApolloLongPollingInfo {
  namespaceName: string;
  notificationId: number;
}

export interface ApolloNotificationOptions extends ApolloLongPollingInfo {
  type: NamespaceType;
}

export interface ApolloClientOptions {
  appId: string;
  configServerUrl: string
  clusterName?: string;
  secret?: string;
}

export interface ApolloThirdPartyClientOptions {
  appId: string;
  env: string;
  portalServerUrl: string
  token: string;
  clusters?: string;
  operator: string;
}
