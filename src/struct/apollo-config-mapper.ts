import { toDeepMatch, toDeepMerge, toDeepReplace } from '@vodyani/utils';

import { IApolloConfigMapper, IApolloConfiguration, ApolloObserverOptions, IApolloConfigurationMapper } from '../common';
import { generateNamespace } from '../method';

export class ApolloConfigMapper implements IApolloConfigMapper<IApolloConfiguration> {
  private config: IApolloConfiguration;

  private options: ApolloObserverOptions[];

  private mappers: Map<string, IApolloConfigurationMapper>;

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

  public updateConfig(namespaceName: string, value: any) {
    if (this.mappers.has(namespaceName)) {
      const keys = this.mappers.get(namespaceName).keys;

      keys.forEach(key => {
        const data = toDeepMatch(this.config, key);
        const newData = toDeepMerge(data, { value });

        toDeepReplace(this.config, newData, key);
      });
    }

    return this.config;
  }
}
