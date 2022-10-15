import { toDeepMatch, toDeepMerge, toDeepSave } from '@vodyani/utils';

import { ApolloObserverOptions, IApolloConfigMapper, IApolloConfiguration, IApolloConfigurationMapper } from '../common';
import { generateNamespace } from '../method';

export class ApolloConfigMapper<T = any> implements IApolloConfigMapper<IApolloConfiguration> {
  private config: IApolloConfiguration<T>;

  private options: ApolloObserverOptions[];

  private mappers: Map<string, IApolloConfigurationMapper<T>>;

  public init(config: IApolloConfiguration) {
    this.options = [];
    this.config = config;
    this.mappers = new Map();

    Object.keys(config.apollo).forEach(index => {
      const domain = config.apollo[index];

      Object.keys(domain).forEach(key => {
        const { options, value } = domain[key];
        const { namespace, type } = options;
        const namespaceName = generateNamespace(namespace, type);
        const namespaceSource = `apollo.${index}.${key}`;

        this.options.push(options);

        if (this.mappers.has(namespaceName)) {
          this.mappers.get(namespaceName).keys.push(namespaceSource);
        } else {
          this.mappers.set(
            namespaceName,
            { keys: [namespaceSource], options, value },
          );
        }
      });
    });
  }

  public getOptions() {
    return this.options;
  }

  public getConfig() {
    return this.config;
  }

  public updateConfig(namespaceName: string, value: any) {
    if (this.mappers.has(namespaceName)) {
      const keys = this.mappers.get(namespaceName).keys;

      keys.forEach(key => {
        const data = toDeepMatch(this.config, key);
        const newData = toDeepMerge(data, { value });

        toDeepSave(this.config, newData, key);
      });
    }

    return this.config;
  }
}
