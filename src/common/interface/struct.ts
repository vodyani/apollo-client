import { NamespaceConfigCallback, NamespaceType } from '../type';

export interface ObserverInfo {
  callback: NamespaceConfigCallback;
  namespace: string;
  type: NamespaceType;
  ip?: string;
  id?: number;
}
