import { describe, it, expect } from '@jest/globals';

import { ApolloClientProvider, ApolloThirdPartClientProvider } from '../src/provider';
import { ApolloClientOptions, ApolloThirdPartyHttpClientOptions } from '../src/common';

const clientOptions: ApolloClientOptions = {
  configServerUrl: 'http://106.54.227.205:8080',
  secret: '6984ceaa48b2405b8606631c0a42e7b4',
  appId: 'vodyani-apollo-config',
};

const apolloClient = new ApolloClientProvider(clientOptions);

afterAll(async () => {
  apolloClient.closeAllListener();
});

describe('ApolloClient', () => {
  it('error ApolloClient', async () => {
    const clientOptions: ApolloClientOptions = {
      configServerUrl: 'http://106.54.227.205:8080',
      appId: 'vodyani-apollo-config',
    };

    const apolloClient = new ApolloClientProvider(clientOptions);

    try {
      await apolloClient.getConfigByCache('application', 'properties');
    } catch (error) {
      expect(error.message).toBe('Incorrect request, please check appId or secret!');
    }

    try {
      await apolloClient.getConfig('application', 'properties');
    } catch (error) {
      expect(error.message).toBe('Incorrect request, please check appId or secret!');
    }
  }, 900000);

  it('getConfigByCache', async () => {
    const application = await apolloClient.getConfigByCache('application', 'properties');
    expect(application).toEqual({ test: '1664183227397' });

    const test = await apolloClient.getConfigByCache('test', 'json');
    expect(test).toEqual({ 'test': '2e', 'v': '3', 'c': 12 });

    try {
      await apolloClient.getConfigByCache('application', 'json');
    } catch (error) {
      expect(error.message).toBe('Incorrect request, please check parameters!');
    }

    try {
      await apolloClient.getConfigByCache('test', 'properties');
    } catch (error) {
      expect(error.message).toBe('Incorrect request, please check parameters!');
    }
  }, 900000);

  it('getConfig', async () => {
    const application = await apolloClient.getConfig('application', 'properties');
    expect(application).toEqual({ test: '1664183227397' });

    const test = await apolloClient.getConfig('test', 'json');
    expect(test).toEqual({ 'test': '2e', 'v': '3', 'c': 12 });

    try {
      await apolloClient.getConfig('application', 'json');
    } catch (error) {
      expect(error.message).toBe('Incorrect request, please check parameters!');
    }

    try {
      await apolloClient.getConfig('test', 'properties');
    } catch (error) {
      expect(error.message).toBe('Incorrect request, please check parameters!');
    }
  }, 900000);

  it('listenNamespace', async () => {
    const time = String(Date.now());
    const clientOptions: ApolloThirdPartyHttpClientOptions = {
      env: 'DEV',
      operator: 'apollo',
      appId: 'vodyani-apollo-config',
      portalServerUrl: 'http://106.54.227.205',
      token: 'fbf1302cd6b2417ebf4511555facbb2371a0fc40',
    };
    const httpClient = new ApolloThirdPartClientProvider(clientOptions);

    await Promise.all([
      apolloClient.listenNamespaces(
        [
          {
            type: 'properties',
            namespace: 'listenNamespace',
            callback: (config: any) => {
              if (config.content === time) {
                apolloClient.clearListener('listenNamespace');
                expect(!!config.content).toBe(true);
              }
            },
          },
          {
            type: 'json',
            namespace: 'listenNamespace3',
            callback: (config: any) => {
              if (config.content === time) {
                apolloClient.clearListener('listenNamespace3');
                expect(!!config.content).toBe(true);
              }
            },
          },
        ],
      ),
      httpClient.saveConfig('listenNamespace', 'properties', time),
      httpClient.saveConfig('listenNamespace3', 'json', JSON.stringify({ content: time })),
    ]);
  });

  it('listenNamespace Namespace duplication', async () => {
    try {
      await apolloClient.listenNamespaces(
        [
          { type: 'properties', namespace: 'simple', callback: () => null },
          { type: 'properties', namespace: 'simple', callback: () => null },
        ],
      );
    } catch (error) {
      expect(error.message).toBe('Incorrect request, namespace is duplication!');
    }
  }, 900000);

  it('listenNamespace error', async () => {
    const clientOptions: ApolloClientOptions = {
      configServerUrl: 'http://106.54.227.205:8080',
      appId: 'vodyani-apollo-config',
      retry: 1,
      delay: 100,
    };

    const apolloClient = new ApolloClientProvider(clientOptions);

    try {
      await apolloClient.listenNamespaces(
        [
          {
            type: 'properties',
            namespace: 'listenNamespace2',
            callback: (config: any) => {
              if (config.content === '2') {
                apolloClient.clearListener('listenNamespace2');
                expect(!!config.content).toBe(true);
              }
            },
          },
        ],
      );
    } catch (error) {
      expect(error.message).toBe('Incorrect long polling, please check appId of secret!');
    }

    apolloClient.closeAllListener();
  }, 90000);
});
