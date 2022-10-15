import { isValidDict, isValidString } from '@vodyani/utils';

import { NamespaceType, Yaml } from '../common';

export function transformContent(data: any, type: NamespaceType) {
  let content: any = null;

  if (isValidString(data)) {
    content = data;
  } else if (isValidDict(data)) {
    content = data.content ? data.content : data;
  } else {
    return null;
  }

  switch (type) {
    case 'txt':
      return content;

    case 'json':
      return JSON.parse(content);

    case 'yml':
      return Yaml.load(content);

    case 'yaml':
      return Yaml.load(content);

    default:
      return data;
  }
}
