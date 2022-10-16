import { This } from '@vodyani/class-decorator';
import { IConfigSubscriber, IObserver } from '@vodyani/core';
import { toNumber, sleep, isValidArray } from '@vodyani/utils';

import { ApolloObserverInfo, NamespaceType } from '../common';
import { generateNamespace, transformNamespace } from '../method';

import { ApolloHttpClient } from './apollo-http-client';

export class ApolloConfigObserver implements IObserver {
  private readonly infos = new Map<string, ApolloObserverInfo>();

  private readonly subscribers = new Map<string, IConfigSubscriber>();

  constructor(
    private readonly httpClient: ApolloHttpClient,
  ) {}

  @This
  public subscribe(info: ApolloObserverInfo, subscriber: IConfigSubscriber) {
    const namespaceName = generateNamespace(info.namespace, info.type);
    this.subscribers.set(namespaceName, subscriber);
    this.infos.set(namespaceName, { ...info, id: 1 });
  }

  @This
  public unSubscribe(namespace: string, type: NamespaceType) {
    const namespaceName = generateNamespace(namespace, type);
    this.subscribers.delete(namespaceName);
    this.infos.delete(namespaceName);
  }

  @This
  public notify(namespace: string, type: NamespaceType, value: any) {
    const namespaceName = generateNamespace(namespace, type);
    const subscriber = this.subscribers.get(namespaceName);

    if (subscriber) {
      subscriber.update(namespaceName, value);
    }
  }

  @This
  public async polling(retry?: number, delay?: number) {
    let errorCount = 0;
    const retryCount = toNumber(retry, 10);
    const delayCount = toNumber(delay, 20000);

    while (this.infos.size > 0) {
      try {
        await this.sync();
      } catch (err) {
        errorCount++;

        if (errorCount > retryCount) {
          throw new Error('Incorrect polling, please check appId of secret!');
        } else {
          await sleep(delayCount);
        }
      }
    }
  }

  @This
  public unPolling() {
    this.infos.clear();
  }

  @This
  private async sync() {
    if (this.infos.size > 0) {
      const notifications: ApolloObserverInfo[] = [];

      this.infos.forEach(e => notifications.push(e));

      const result = await this.httpClient.getConfigNotifications(notifications);

      if (isValidArray(result)) {
        for (const notification of result) {
          const { namespaceName, notificationId } = notification;
          const namespace = transformNamespace(namespaceName);
          const observerInfo = this.infos.get(namespaceName);

          if (observerInfo) {
            const { id, type, ip } = observerInfo;

            observerInfo.id = notificationId;

            if (id !== 1) {
              const config = await this.httpClient.getConfig(namespace, type, ip);

              this.notify(namespace, type, config);
            }
          }
        }
      }
    }
  }
}
