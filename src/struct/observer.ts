import { This } from '@vodyani/class-decorator';
import { isValid, isValidArray, sleep } from '@vodyani/utils';

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
    const data = await this.apolloClient.getConfigNotifications([{
      namespaceName: namespace,
      notificationId: this.id,
      type,
    }]);

    if (isValidArray(data)) {
      const info = data.find(e => {
        const namespaceName = e.namespaceName.includes('.json')
          ? e.namespaceName.split('.json')[0]
          : e.namespaceName;

        return namespaceName === namespace;
      });

      if (isValid(info)) {
        const config = await this.apolloClient.getConfig(namespace, type, ip);

        this.id = info.notificationId;
        this.notify(config);
      }
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
  private listener = new Map<string, number>();

  constructor(
    private readonly apolloClient: ApolloHttpClient,
  ) {}

  @This
  public async deploy(infos: ObserverInfo[]) {
    for (const info of infos) {
      const subject = new ApolloNamespaceSubject(this.apolloClient);
      const observer = new ApolloNamespaceObserver(info.callback);

      subject.attach(observer);

      await this.listen(subject, info);
    }
  }

  @This
  public close() {
    this.listener.forEach((_, namespace) => this.clear(namespace));
  }

  @This
  public clear(namespace: string) {
    if (this.listener.has(namespace)) {
      this.listener.delete(namespace);
    }
  }

  @This
  private async listen(
    subject: ApolloNamespaceSubject,
    { namespace, type, ip }: ObserverInfo,
  ) {
    this.listener.set(namespace, 1);

    while (this.listener.get(namespace) === 1) {
      try {
        await subject.longPolling(namespace, type, ip);
      } catch (err) {
        console.error(err.message);
        await sleep(1000);
      }
    }
  }
}
