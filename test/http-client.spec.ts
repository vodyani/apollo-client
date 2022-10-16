import { describe, expect, it } from '@jest/globals';
import { IConfigSubscriber } from '@vodyani/core';

import {
  ApolloHttpClient,
  ApolloHttpClientOptions, ApolloThirdPartyHttpClient,
  ApolloThirdPartyHttpClientOptions, ApolloConfigObserver,
} from '../src';

const options: ApolloHttpClientOptions = {
  configServerUrl: 'http://106.54.227.205:8080',
  secret: '825b411eb95442c7bd0f696077cef72e',
  appId: 'vodyani-apollo-config',
};

const thirdPartyOptions: ApolloThirdPartyHttpClientOptions = {
  env: 'DEV',
  operator: 'apollo',
  appId: 'vodyani-apollo-config',
  portalServerUrl: 'http://106.54.227.205',
  token: '0dd6ada2ae97abb2bb6cb5c9818141a6c3faf0c3',
};

const thirdPartyClient = new ApolloThirdPartyHttpClient(thirdPartyOptions);
const httpClient = new ApolloHttpClient(options);
const observer = new ApolloConfigObserver(httpClient);
const timeout = 999999;


afterAll(async () => {
  observer.unPolling();
});

describe('Http Client', () => {
  it('ApolloThirdPartyHttpClient.getConfig', async () => {
    const [
      properties,
      json,
      yaml,
      yml,
      txt,
    ] = await Promise.all([
      thirdPartyClient.getConfig('application', 'properties', 'test'),
      thirdPartyClient.getConfig('test', 'json'),
      thirdPartyClient.getConfig('test', 'yaml'),
      thirdPartyClient.getConfig('test', 'yml'),
      thirdPartyClient.getConfig('test', 'txt'),
    ]);

    expect(properties).toEqual('1664183227397');
    expect(json).toEqual({ test: '2e', 'v': '3', 'c': 12 });
    expect(yaml).toEqual({ test: 'test' });
    expect(yml).toEqual({ test: 'test' });
    expect(txt).toBe('test');
  }, timeout);

  it('ApolloThirdPartyHttpClient del & save config', async () => {
    const value = { json: 'json' };

    await thirdPartyClient.saveConfig('del', 'json', JSON.stringify(value));

    const result = await httpClient.getConfig('del', 'json');

    expect(result).toEqual(value);

    await thirdPartyClient.deleteConfig('del', 'json');

    const res = await httpClient.getConfig('del', 'json');

    expect(res).toBe(null);
  }, timeout);

  it('ApolloHttpClient.getConfigByCache', async () => {
    const [
      properties,
      json,
      yaml,
      yml,
      txt,
    ] = await Promise.all([
      httpClient.getConfigByCache('application', 'properties'),
      httpClient.getConfigByCache('test', 'json'),
      httpClient.getConfigByCache('test', 'yaml'),
      httpClient.getConfigByCache('test', 'yml'),
      httpClient.getConfigByCache('test', 'txt'),
    ]);

    expect(properties).toEqual({ test: '1664183227397' });
    expect(json).toEqual({ test: '2e', 'v': '3', 'c': 12 });
    expect(yaml).toEqual({ test: 'test' });
    expect(yml).toEqual({ test: 'test' });
    expect(txt).toBe('test');
  }, timeout);

  it('ApolloHttpClient.getConfig', async () => {
    const [
      properties,
      json,
      yaml,
      yml,
      txt,
    ] = await Promise.all([
      httpClient.getConfig('application', 'properties'),
      httpClient.getConfig('test', 'json'),
      httpClient.getConfig('test', 'yaml'),
      httpClient.getConfig('test', 'yml'),
      httpClient.getConfig('test', 'txt'),
    ]);

    expect(properties).toEqual({ test: '1664183227397' });
    expect(json).toEqual({ test: '2e', 'v': '3', 'c': 12 });
    expect(yaml).toEqual({ test: 'test' });
    expect(yml).toEqual({ test: 'test' });
    expect(txt).toBe('test');
  }, timeout);

  it('ApolloHttpClient.subscribe', async () => {
    const current = Date.now();

    class DemoSubscriber implements IConfigSubscriber {
      public update(key: string, value: any) {
        observer.unSubscribe('listenNamespace', 'properties');
        observer.unSubscribe('json', 'json');
        observer.unPolling();

        try {
          expect(key).toBe('listenNamespace');
          expect(value).toEqual({ content: String(current) });
        } catch (error) {
          console.log(error);
        }
      }
    }

    observer.subscribe(
      {
        namespace: 'listenNamespace',
        type: 'properties',
      },
      new DemoSubscriber(),
    );

    observer.subscribe(
      {
        namespace: 'json',
        type: 'json',
      },
      new DemoSubscriber(),
    );

    await Promise.all([
      observer.polling(),
      thirdPartyClient.saveConfig('listenNamespace', 'properties', String(current), 'content'),
    ]);
  }, timeout);

  it('ApolloHttpClient.error options', async () => {
    const options: ApolloHttpClientOptions = {
      configServerUrl: 'http://106.54.227.205:8080',
      appId: 'vodyani-apollo-config',
    };

    const errorHttpClient = new ApolloHttpClient(options);
    const observer = new ApolloConfigObserver(errorHttpClient);

    observer.subscribe(
      {
        namespace: 'listenNamespace2',
        type: 'properties',
      },
      {
        update: () => null,
      },
    );

    let message = '';

    try {
      await observer.polling(2, 100);
    } catch (error) {
      message = error.message;
    }

    expect(message).toBe('Incorrect polling, please check appId of secret!');
  }, timeout);
});
