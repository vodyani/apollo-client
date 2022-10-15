import { resolve } from 'path';

import { IConfigClientSubscriber } from '@vodyani/core';
import { describe, it, expect } from '@jest/globals';
import { toDeepMatch } from '@vodyani/utils';

import { ApolloClientBuilder, ApolloThirdPartyHttpClient } from '../src';

const clientOptions = {
  configServerUrl: 'http://106.54.227.205:8080',
  secret: '6984ceaa48b2405b8606631c0a42e7b4',
  appId: 'vodyani-apollo-config',
};

const thirdPartyOptions = {
  env: 'DEV',
  operator: 'apollo',
  appId: 'vodyani-apollo-config',
  portalServerUrl: 'http://106.54.227.205',
  token: 'fbf1302cd6b2417ebf4511555facbb2371a0fc40',
};

const timeout = 999999;
const thirdPartyClient = new ApolloThirdPartyHttpClient(thirdPartyOptions);

describe('ApolloClientBuilder', () => {
  it('test', async () => {
    const current = Date.now();

    const builder = new ApolloClientBuilder({
      clientOptions,
      clientPollDelay: 1000,
      clientPollRetry: 4,
      configEnv: 'DEV',
      configFileType: 'json',
      configFilePath: `${resolve(__dirname, './files')}/json`,
    });

    const { loader, client } = builder
      .buildLoader()
      .buildClient()
      .export();

    class DemoSubscriber implements IConfigClientSubscriber {
      public update(value: any) {
        client.unSubscribe();
        client.unPolling();

        const config = toDeepMatch(value, 'apollo.domain.client');

        try {
          expect(config.value).toEqual({ content: String(current) });
        } catch (error) {
          console.log(error);
        }
      }
    }

    await client.init(loader);

    client.subscribe(new DemoSubscriber());

    await Promise.all([
      client.polling(),
      thirdPartyClient.saveConfig(
        'client',
        'json',
        JSON.stringify({ content: String(current) }),
      ),
    ]);
  }, timeout);
});
