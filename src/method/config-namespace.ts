import { NamespaceType } from '../common';

export function generateNamespace(namespace: string, type: NamespaceType) {
  return type === 'properties' ? namespace : `${namespace}.${type}`;
}

export function transformNamespace(namespace: string) {
  const types = ['.json', '.yaml', '.yml', '.txt'];
  const result = types.find(type => namespace.includes(type));

  return result ? namespace.split(result)[0] : namespace;
}
