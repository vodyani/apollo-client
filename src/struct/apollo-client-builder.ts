import { ApolloClientBuildOptions } from '../common';

import { ApolloConfigClient } from './apollo-client';
import { ApolloConfigMapper } from './apollo-config-mapper';
import { ApolloConfigObserver } from './apollo-config-observer';
import { ApolloHttpClient } from './apollo-http-client';

export class ApolloClientBuilder {
  public build(options: ApolloClientBuildOptions) {
    const { clientOptions, clientMapper, clientPollRetry, clientPollDelay } = options;

    const mapper = clientMapper || new ApolloConfigMapper();
    const httpClient = new ApolloHttpClient(clientOptions);
    const observer = new ApolloConfigObserver(httpClient);

    return new ApolloConfigClient(
      httpClient,
      mapper,
      observer,
      clientPollRetry,
      clientPollDelay,
    );
  }
}
