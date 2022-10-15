import { This } from '@vodyani/class-decorator';
import { IConfigClient, IConfigClientSubscriber, IConfigLoader } from '@vodyani/core';

import { IApolloConfigMapper } from '../common';

import { ApolloHttpClient } from './apollo-http-client';

export class ApolloClient implements IConfigClient {
  private subscriber: IConfigClientSubscriber;

  constructor(
    private readonly client: ApolloHttpClient,
    private readonly configMapper: IApolloConfigMapper,
    private readonly clientPollRetry?: number,
    private readonly clientPollDelay?: number,
  ) {}

  @This
  public async init<T = any>(loader: IConfigLoader) {
    const result = await loader.execute<T>();
    return result;
  }

  @This
  public subscribe(subscriber: IConfigClientSubscriber) {
    this.subscriber = subscriber;

    const options = this.configMapper.getOptions();

    if (options) {
      options.forEach(info => {
        this.client.subscribe(info, this);
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
    await this.client.polling(this.clientPollRetry, this.clientPollDelay);
  }

  @This
  public unPolling() {
    this.client.unPolling();
  }

  @This
  public update(namespaceName: string, value: any) {
    const config = this.configMapper.updateConfig(namespaceName, value);
    this.notify(config);
  }
}
