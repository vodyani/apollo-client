import { resolve } from 'path';

import { describe, it, expect } from '@jest/globals';

import { ApolloConfigLoader, ApolloConfigMapper, ApolloHttpClient, ApolloHttpClientOptions } from '../src';

const options: ApolloHttpClientOptions = {
  configServerUrl: 'http://106.54.227.205:8080',
  secret: '6984ceaa48b2405b8606631c0a42e7b4',
  appId: 'vodyani-apollo-config',
};

const path = resolve(__dirname, './files');
const json = `${path}/json`;
const yaml = `${path}/yaml`;
const yml = `${path}/yml`;
const timeout = 999999;

const httpClient = new ApolloHttpClient(options);

describe('ApolloConfigLoader', () => {
  it('test', async () => {
    const JSONConfigLoader = new ApolloConfigLoader(json, 'DEFAULT', 'json', httpClient, new ApolloConfigMapper());
    const YAMLConfigLoader = new ApolloConfigLoader(yaml, 'DEFAULT', 'yaml', httpClient, new ApolloConfigMapper());
    const YMLConfigLoader = new ApolloConfigLoader(yml, 'DEFAULT', 'yaml', httpClient, new ApolloConfigMapper());

    const [
      res1,
      res2,
      res3,
    ] = await Promise.all([
      JSONConfigLoader.execute(),
      YAMLConfigLoader.execute(),
      YMLConfigLoader.execute(),
    ]);

    const value = {
      'apollo': {
        'domain': {
          'listenNamespace2': {
            'options': {
              'namespace': 'listenNamespace2',
              'type': 'properties',
            },
            'value': {
              'content': '2',
            },
          },
          'listenNamespace3': {
            'options': {
              'namespace': 'listenNamespace3',
              'type': 'json',
            },
            'value': {
              'content': '1664508738430',
            },
          },
        },
      },
    };

    const jsonValue = {
      'apollo': {
        'domain': {
          'listenNamespace2': {
            'options': {
              'namespace': 'listenNamespace2',
              'type': 'properties',
            },
            'value': {
              'content': '2',
            },
          },
          'listenNamespace3': {
            'options': {
              'namespace': 'listenNamespace3',
              'type': 'json',
            },
            'value': {
              'content': '1664508738430',
            },
          },
          'listenNamespace4': {
            'options': {
              'namespace': 'listenNamespace3',
              'type': 'json',
            },
            'value': {
              'content': '1664508738430',
            },
          },
        },
      },
    };

    expect(res1).toEqual(jsonValue);
    expect(res2).toEqual(value);
    expect(res3).toEqual(value);
  }, timeout);
});
