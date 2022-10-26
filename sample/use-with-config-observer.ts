import { IConfigSubscriber } from '@vodyani/core';
import { toDeepMerge, toHash } from '@vodyani/utils';
import { ApolloHttpClient, ApolloConfigObserver } from '@vodyani/apollo-client';

class ConfigProvider {
  private config: Record<string, any> = Object();

  public get(namespaceName: string) {
    return this.config[namespaceName];
  }

  public merge(value: Record<string, any>) {
    this.config = toDeepMerge(this.config, value);
  }
}

class ConfigSubscriber implements IConfigSubscriber {
  private readonly hashMap: Map<string, string> = new Map();

  constructor(
    private readonly config: ConfigProvider,
  ) {}

  public update(namespaceName: string, value: any) {
    const currentHash = toHash(value);
    const beforeHash = this.hashMap.get(namespaceName);

    if (currentHash !== beforeHash) {
      this.hashMap.set(namespaceName, currentHash);
      this.config.merge({ [namespaceName]: value });
    }
  }
}

const clientOptions = {
  appId: 'your_apollo_app_id',
  configServerUrl: 'your_apollo_config_server_url',
};

const client = new ApolloHttpClient(clientOptions);
const observer = new ApolloConfigObserver(client);

const configProvider = new ConfigProvider();
const configSubscriber = new ConfigSubscriber(configProvider);

observer.subscribe(
  {
    namespace: 'your_apollo_namespace',
    type: 'json',
  },
  configSubscriber,
);

observer.polling();

// When the data in the configuration center is updated, the latest data is obtained in real time :)
configProvider.get('your_apollo_namespace');
