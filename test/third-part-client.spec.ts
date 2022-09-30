import { describe, it, expect } from '@jest/globals';

import { ApolloThirdPartClientProvider } from '../src/provider';
import { ApolloThirdPartyHttpClientOptions } from '../src/common';

const clientOptions: ApolloThirdPartyHttpClientOptions = {
  env: 'DEV',
  operator: 'apollo',
  appId: 'vodyani-apollo-config',
  portalServerUrl: 'http://106.54.227.205',
  token: 'fbf1302cd6b2417ebf4511555facbb2371a0fc40',
};

describe('ApolloThirdPartyHttpClient', () => {
  const httpClient = new ApolloThirdPartClientProvider(clientOptions);

  it('error', async () => {
    const clientOptions: ApolloThirdPartyHttpClientOptions = {
      env: 'DEV',
      operator: 'apollo',
      appId: 'vodyani-apollo-config',
      portalServerUrl: 'http://106.54.227.205',
      token: '?',
    };
    const httpClient = new ApolloThirdPartClientProvider(clientOptions);
    const time = Date.now();
    const value = { json: time };
    const valueStr = JSON.stringify(value);

    try {
      await httpClient.saveConfig('json', 'json', valueStr);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    try {
      await httpClient.deleteConfig('json', 'json');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    try {
      await httpClient.getConfig('json', 'json');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  }, 90000);

  it('get', async () => {
    const json = await httpClient.getConfig('test', 'json');
    expect(json).toEqual({ test: '2e', v: '3', c: 12 });

    const properties = await httpClient.getConfig('application', 'properties', 'test');
    expect(properties).toBe('1664183227397');

    try {
      await httpClient.getConfig('application', 'properties');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  }, 90000);

  it('change json', async () => {
    const time = Date.now();
    const value = { json: time };
    const valueStr = JSON.stringify(value);

    await httpClient.saveConfig('json', 'json', valueStr);

    const saveResult = await httpClient.getConfig('json', 'json');
    expect(saveResult).toEqual(value);

    await httpClient.deleteConfig('json', 'json');

    try {
      await httpClient.getConfig('json', 'json');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  }, 90000);

  it('change properties', async () => {
    const time = Date.now();
    const newValue = `new_${time}`;

    try {
      await httpClient.getConfig('application', 'properties', 'new');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    await httpClient.saveConfig('application', 'properties', newValue, 'new');

    const properties = await httpClient.getConfig('application', 'properties', 'new');
    expect(properties).toBe(newValue);

    await httpClient.deleteConfig('application', 'properties', 'new');

    try {
      await httpClient.getConfig('application', 'properties', 'new');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  }, 90000);
});
