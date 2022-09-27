import { This } from '@vodyani/class-decorator';
import { isValidArray, circular, CircularHandler } from '@vodyani/utils';

import {
  NamespaceConfigCallback,
  NamespaceType,
  Observer,
  ObserverInfo,
  Scheduler,
  Subject,
} from '../common';

import { ApolloHttpClient } from './http-client';

export class ApolloNamespaceSubject implements Subject {
  private id = 1;

  private observers: Observer[] = [];

  constructor(
    private readonly apolloClient: ApolloHttpClient,
  ) {}

  @This
  public attach(observer: Observer): void {
    const isExist = this.observers.includes(observer);

    if (isExist) {
      throw new Error('Subject: Observer has been attached already.');
    }

    this.observers.push(observer);
  }

  @This
  public detach(observer: Observer): void {
    const observerIndex = this.observers.indexOf(observer);

    if (observerIndex === -1) {
      throw new Error('Subject: Nonexistent observer.');
    }

    this.observers.splice(observerIndex, 1);
  }

  @This
  public notify(content: Record<string, any>): void {
    for (const observer of this.observers) {
      observer.update(content);
    }
  }

  @This
  public async longPolling(namespace: string, type: NamespaceType, ip?: string) {
    // start long polling.
    const data = await this.apolloClient.longPolling([{
      namespaceName: namespace,
      notificationId: this.id,
      type,
    }]);

    if (isValidArray(data)) {
      const info = data.find(e => e.namespaceName === namespace);
      const config = await this.apolloClient.getConfig(namespace, type, ip);

      this.id = info.notificationId;

      // notify all observer.
      this.notify(config);
    }
  }
}

export class ApolloNamespaceObserver implements Observer {
  constructor(
    private readonly callback: NamespaceConfigCallback,
  ) {}

  @This
  public update(content: Record<string, any>): void {
    this.callback(content);
  }
}

export class ApolloScheduler implements Scheduler {
  private handlers = new Map<string, CircularHandler>();

  constructor(
    private readonly apolloClient: ApolloHttpClient,
  ) {}

  @This
  public listen(infos: ObserverInfo[], interval = 60000) {
    for (const info of infos) {
      const subject = new ApolloNamespaceSubject(this.apolloClient);
      const observer = new ApolloNamespaceObserver(info.callback);

      subject.attach(observer);

      const handler = circular(this.longPolling, interval, info, subject);
      this.handlers.set(info.namespace, handler);
    }
  }

  @This
  public close() {
    this.handlers.forEach(({ close }) => close());
  }

  @This
  public clear(namespace: string) {
    if (this.handlers.has(namespace)) {
      this.handlers.get(namespace).close();
      this.handlers.delete(namespace);
    }
  }

  @This
  private async longPolling(
    info: ObserverInfo,
    subject: ApolloNamespaceSubject,
  ) {
    await subject.longPolling(info.namespace, info.type, info.ip);
  }
}
