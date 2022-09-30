import { This } from '@vodyani/class-decorator';
import { isValid, isValidArray, sleep } from '@vodyani/utils';

import {
  ApolloNotificationOptions,
  ObserverInfo,
} from '../common';

import { ApolloHttpClient } from './client';

export class ApolloScheduler {
  private listener = new Map<string, ObserverInfo>();

  constructor(
    private readonly apolloClient: ApolloHttpClient,
    private readonly retry = 1,
    private readonly delay = 1000,
  ) {}

  @This
  public close() {
    this.listener.clear();
  }

  @This
  public clear(namespace: string) {
    if (this.listener.has(namespace)) {
      this.listener.delete(namespace);
    }
  }

  @This
  public async deploy(infos: ObserverInfo[]) {
    for (const info of infos) {
      if (!this.listener.has(info.namespace)) {
        this.listener.set(info.namespace, { id: 1, ...info });
      }
    }

    await this.longPolling();
  }

  @This
  private async longPolling() {
    let errorCount = 0;

    while (this.listener.size > 0) {
      try {
        await this.sync();
      } catch (err) {
        errorCount++;

        if (errorCount > this.retry) {
          throw new Error('Incorrect long polling, please check appId of secret!');
        } else {
          await sleep(this.delay);
        }
      }
    }
  }

  @This
  private async sync() {
    const listeners: ObserverInfo[] = [];
    const notifications: ApolloNotificationOptions[] = [];

    this.listener.forEach((info) => {
      const { namespace, type, id } = info;

      listeners.push(info);

      notifications.push({ namespaceName: namespace, notificationId: id, type });
    });

    const data = await this.apolloClient.getConfigNotifications(notifications);

    if (isValidArray(data)) {
      for (const listener of listeners) {
        const { callback, namespace, type, id, ip } = listener;

        const info = data.find(e => {
          const namespaceName = e.namespaceName.includes('.json')
            ? e.namespaceName.split('.json')[0]
            : e.namespaceName;

          return namespaceName === namespace;
        });

        if (isValid(info)) {
          const config = await this.apolloClient.getConfig(namespace, type, ip);

          this.listener.set(namespace, { id: info.notificationId, callback, namespace, type, ip });

          if (id !== 1) {
            callback(config);
          }
        }
      }
    }
  }
}
