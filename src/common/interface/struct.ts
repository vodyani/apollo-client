import { NamespaceConfigCallback, NamespaceType } from '../type';

export interface Subject {
  // Attach an observer to the subject.
  attach(observer: Observer): void;
  // Detach an observer from the subject.
  detach(observer: Observer): void;
  // Notify all observers about an event.
  notify(content: any): void;
}

export interface Observer {
  update(content: any): void;
}

export interface Scheduler {
  listen(...args: any[]): void;
  close(...args: any[]): void;
  clear(...args: any[]): void;
}

export interface ObserverInfo {
  callback: NamespaceConfigCallback;
  namespace: string;
  type: NamespaceType;
  ip?: string;
}
