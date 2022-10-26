import { resolve } from 'path';

import { Injectable, Module } from '@nestjs/common';
import { ApolloClientBuilder } from '@vodyani/apollo-client';
import { ArkModule, ConfigProvider, JSONConfigLoader } from '@vodyani/ark';

@Module({
  imports: [
    ArkModule.forRoot({
      global: true,
      enableDynamicDataSource: true,
      clients: [
        {
          enablePolling: true,
          enableSubscribe: true,
          // You can also use other profile loaders
          loader: new JSONConfigLoader(resolve(__dirname, '../apollo-client'), 'DEFAULT'),
          // The format of the file you can customize,
          // and the conversion is done by passing in your custom configuration mapper (The `IApolloConfigMapper` interface needs to be implemented),
          // where the default converter `ApolloConfigMapper` will be used :)
          client: new ApolloClientBuilder().build({
            // We recommend that you use process parameters.
            // like: `process.env.APOLLO_APP_ID`
            clientOptions: {
              appId: 'your_apollo_app_id',
              configServerUrl: 'your_apollo_config_server_url',
            },
          }),
        },
      ],
    }),
  ],
})
export class AppModule {}

// Usage in the other provider
@Injectable
class Logger {
  constructor(
    private readonly config: ConfigProvider,
  ) {}

  public report(message: string) {
    const level = this.config.get('logger.level');

    // do something ...
  }
}
