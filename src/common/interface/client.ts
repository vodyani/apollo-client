import { ApolloObserverOptions } from './options';

export interface IApolloConfigurationItem<T> {
  options: ApolloObserverOptions;
  value: T;
}

export interface IApolloConfigurationMapper<T = any> {
  options: ApolloObserverOptions;
  keys: string[];
  value: T;
}

export interface IApolloConfiguration<T = any> {
  apollo: {
    [domain: string]: {
      [namespace: string]: IApolloConfigurationItem<T>;
    };
  }
}

export interface IApolloConfigMapper<T = any> {
  init: (config: T) => void;

  getOptions: () => ApolloObserverOptions[];

  getConfig: () => T;

  updateConfig: (namespaceName: string, value: any) => T;
}
