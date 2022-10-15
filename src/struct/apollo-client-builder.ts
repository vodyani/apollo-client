import { ApolloClientBuildOptions, IApolloConfigMapper } from '../common';

import { ApolloClient } from './apollo-client';
import { ApolloConfigLoader } from './apollo-config-loader';
import { ApolloConfigMapper } from './apollo-config-mapper';
import { ApolloHttpClient } from './apollo-http-client';

export class ApolloClientBuilder {
  private client: ApolloClient;

  private loader: ApolloConfigLoader;

  private mapper: IApolloConfigMapper;

  private httpClient: ApolloHttpClient;

  constructor(
    private readonly options: ApolloClientBuildOptions,
  ) {
    this.httpClient = new ApolloHttpClient(this.options.clientOptions);
    this.mapper = this.options.configMapper || new ApolloConfigMapper();
  }

  public buildLoader() {
    const { configEnv, configFilePath, configFileType } = this.options;

    this.loader = new ApolloConfigLoader(
      configFilePath,
      configEnv,
      configFileType,
      this.httpClient,
      this.mapper,
    );

    return this;
  }

  public buildClient() {
    const { clientPollRetry, clientPollDelay } = this.options;

    this.client = new ApolloClient(this.httpClient, this.mapper, clientPollRetry, clientPollDelay);
    return this;
  }

  public export() {
    return {
      client: this.client,
      loader: this.loader,
    };
  }
}
