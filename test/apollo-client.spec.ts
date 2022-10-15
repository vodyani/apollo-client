import { IConfigClientSubscriber, IConfigLoader } from '@vodyani/core';
import { describe, it, expect } from '@jest/globals';
import { toDeepMatch } from '@vodyani/utils';

import { ApolloClientBuilder, ApolloThirdPartyHttpClient } from '../src';

class Loader implements IConfigLoader {
  execute() {
    return {
      'apollo': {
        'domain': {
          'client001': {
            'options': {
              'namespace': 'client',
              'type': 'json',
            },
          },
          'client002': {
            'options': {
              'namespace': 'client',
              'type': 'json',
            },
          },
        },
      },
    };
  }
}

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

const thirdPartyClient = new ApolloThirdPartyHttpClient(thirdPartyOptions);
const timeout = 999999;

describe('ApolloClientBuilder', () => {
  it('test', async () => {
    const current = Date.now();
    const loader = new Loader();
    const client = new ApolloClientBuilder().build({
      clientOptions,
      clientPollDelay: 1000,
      clientPollRetry: 4,
    });

    class DemoSubscriber implements IConfigClientSubscriber {
      public update(value: any) {
        client.unSubscribe();
        client.unPolling();

        const config = toDeepMatch(value, 'apollo.domain.client001');

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
