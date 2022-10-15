import { This } from '@vodyani/class-decorator';
import { IConfigClient, IConfigClientSubscriber, IConfigLoader } from '@vodyani/core';

import { IApolloConfigMapper } from '../common';
import { generateNamespace } from '../method';

import { ApolloHttpClient } from './apollo-http-client';
import { ApolloConfigObserver } from './apollo-config-observer';

export class ApolloConfigClient implements IConfigClient {
  private subscriber: IConfigClientSubscriber;

  constructor(
    private readonly httpClient: ApolloHttpClient,
    private readonly mapper: IApolloConfigMapper,
    private readonly observer: ApolloConfigObserver,
    private readonly retry?: number,
    private readonly delay?: number,
  ) {}

  @This
  public async init<T = any>(loader: IConfigLoader<T>) {
    const result = await loader.execute();

    this.mapper.init(result);

    for (const { namespace, type, ip } of this.mapper.getOptions()) {
      const value = await this.httpClient.getConfigByCache(namespace, type, ip);
      const namespaceName = generateNamespace(namespace, type);
      this.mapper.updateConfig(namespaceName, value);
    }

    return result;
  }

  @This
  public subscribe(subscriber: IConfigClientSubscriber) {
    this.subscriber = subscriber;

    const options = this.mapper.getOptions();

    if (options) {
      options.forEach(info => {
        this.observer.subscribe(info, this);
      });
    }
  }

  @This
  public unSubscribe() {
    this.subscriber = null;
  }

  @This
  public notify(value: any) {
    this.subscriber.update(value);
  }

  @This
  public async polling() {
    await this.observer.polling(this.retry, this.delay);
  }

  @This
  public unPolling() {
    this.observer.unPolling();
  }

  @This
  public update(namespaceName: string, value: any) {
    const config = this.mapper.updateConfig(namespaceName, value);
    this.notify(config);
  }
}
