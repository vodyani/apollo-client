import { existsSync, readFileSync } from 'fs';

import { IConfigLoader } from '@vodyani/core';

import { IApolloConfigMapper, IApolloConfiguration, Yaml } from '../common';
import { generateNamespace } from '../method';

import { ApolloHttpClient } from './apollo-http-client';


class JSONConfigLoader implements IConfigLoader {
  constructor(
    private readonly path: string,
    private readonly env: string,
  ) {}

  public execute<T = any>() {
    return this.readJSONFile(this.env) as T;
  }

  private readJSONFile(env: string) {
    const str = readFileSync(`${this.path}/${env}.json`, { encoding: 'utf8' });
    const result = JSON.parse(str);
    return result;
  }
}

class YamlConfigLoader implements IConfigLoader {
  constructor(
    private readonly path: string,
    private readonly env: string,
  ) {}

  public execute<T = any>() {
    return this.readYamlFile(this.env) as T;
  }

  private readYamlFile(env: string) {
    let path = `${this.path}/${env}.yml`;

    if (!existsSync(path)) {
      path = `${this.path}/${env}.yaml`;
    }

    const str = readFileSync(path, { encoding: 'utf8' });
    const result = Yaml.load(str) as any;
    return result;
  }
}

export class ApolloConfigLoader implements IConfigLoader {
  constructor(
    private readonly path: string,
    private readonly env: string,
    private readonly type: 'json' | 'yaml',
    private readonly httpClient: ApolloHttpClient,
    private readonly mapper: IApolloConfigMapper,
  ) {}

  public async execute() {
    const fileLoader = this.type === 'json'
      ? new JSONConfigLoader(this.path, this.env)
      : new YamlConfigLoader(this.path, this.env);

    const configData = fileLoader.execute<IApolloConfiguration>();

    this.mapper.init(configData);

    const options = this.mapper.getOptions();

    for (const { namespace, type, ip } of options) {
      const value = await this.httpClient.getConfigByCache(namespace, type, ip);
      const namespaceName = generateNamespace(namespace, type);

      this.mapper.updateConfig(namespaceName, value);
    }

    return this.mapper.getConfig();
  }
}
