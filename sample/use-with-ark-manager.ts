import { resolve } from 'path';

import { ApolloClientBuilder, IApolloConfiguration } from '@vodyani/apollo-client';
import { ArkManager, ConfigProvider, JSONConfigLoader } from '@vodyani/ark';

export class Ark {
  // Here the generic type `IApolloConfiguration` supports customization.
  private static instance: ConfigProvider<IApolloConfiguration>;

  public static getProvider() {
    return Ark.instance ? Ark.instance : Ark.init();
  }

  private static init() {
    const provider = new ConfigProvider();

    Ark.instance = new ArkManager()
      .create({
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
      })
      .useFactory(provider);

    return Ark.instance;
  }
}

const configProvider = Ark.getProvider();

// When the data in the configuration center is updated, the latest data is obtained in real time :)
configProvider.get('apollo.your_custom_domain_name.your_custom_namespace_alias');
