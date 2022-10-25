# Vodyani apollo-client

🛸 携程 apollo 配置中心客户端。支持查询配置、订阅配置、使用开放中心提供的公共 API。

[![Npm](https://img.shields.io/npm/v/@vodyani/apollo-client/latest.svg)](https://www.npmjs.com/package/@vodyani/apollo-client)
[![Npm](https://img.shields.io/npm/v/@vodyani/apollo-client/beta.svg)](https://www.npmjs.com/package/@vodyani/apollo-client)
[![Npm](https://img.shields.io/npm/dm/@vodyani/apollo-client)](https://www.npmjs.com/package/@vodyani/apollo-client)
[![License](https://img.shields.io/github/license/vodyani/apollo-client)](LICENSE)
<br>
[![codecov](https://codecov.io/gh/vodyani/apollo-client/branch/master/graph/badge.svg?token=D6T333EU09)](https://codecov.io/gh/vodyani/apollo-client)
![Workflow](https://github.com/vodyani/apollo-client/actions/workflows/release.yml/badge.svg)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

## Installation

```sh
npm install @vodyani/apollo-client
```

## Usage

- [ApolloHttpClient](#apollohttpclient)
  - [getConfig](#apollohttpclient-getconfig)
  - [getConfigByCache](#apollohttpclient-getconfigbycache)
  - [getConfigNotifications](#apollohttpclient-getconfignotifications)
- [ApolloThirdPartyHttpClient](#apollothirdpartyhttpclient)
  - [getConfig](#apollothirdpartyhttpclient-getconfig)
  - [saveConfig](#apollothirdpartyhttpclient-saveconfig)
  - [deleteConfig](#apollothirdpartyhttpclient-deleteconfig)
- [ApolloConfigObserver](#apolloconfigobserver)
  - [subscribe](#apolloconfigobserver-subscribe)
  - [unSubscribe](#apolloconfigobserver-unsubscribe)
  - [notify](#apolloconfigobserver-notify)
  - [polling](#apolloconfigobserver-polling)
  - [unPolling](#apolloconfigobserver-unpolling)
- [Use Client With Ark (Recommendation ⭐️)](#use-client-with-ark)
- [Supported Configuration types](#supported-configuration-types)

### ApolloHttpClient

```ts
import { ApolloHttpClient } from '@vodyani/apollo-client'

const options = {
  appId: 'your_apollo_app_id',
  configServerUrl: 'your_apollo_config_server_url',
  clusterName: 'your_apollo_cluster_name',
  secret: 'your_apollo_app_secret',
};

const httpClient = new ApolloHttpClient(options);
```

options

- appId (require: ✅) apollo app id
- configServerUrl (require: ✅) apollo config server url
- clusterName (require: ❎) apollo app cluster name
- secret (require: ❎) apollo app secret

#### ApolloHttpClient getConfig

```ts
const result = await httpClient.getConfig(
  'your_apollo_namespace',
  'properties',
  'your_apollo_namespace_ip,
)
```

params

- namespace `string` apollo app namespace. (require: ✅)
- type [`NamespaceType`](#supported-configuration-types) apollo app namespace type.  (require: ✅)
- ip `string` apollo app server ip  (require: ❎), [see docs](https://www.apolloconfig.com/#/zh/usage/other-language-client-user-guide?id=_12-%e9%80%9a%e8%bf%87%e5%b8%a6%e7%bc%93%e5%ad%98%e7%9a%84http%e6%8e%a5%e5%8f%a3%e4%bb%8eapollo%e8%af%bb%e5%8f%96%e9%85%8d%e7%bd%ae)

return

```ts
{
  'your_apollo_namespace_key': 'your_apollo_namespace_value'
}
```

- *Other than txt, which returns text, all formats are deserialized as objects.*

#### ApolloHttpClient getConfigByCache

> Call this method to access cached data.

```ts
const result = await httpClient.getConfigByCache(
  'your_apollo_namespace',
  'properties',
  'your_apollo_namespace_ip,
)
```

params

- namespace `string` apollo app namespace. (require: ✅)
- type [`NamespaceType`](#supported-configuration-types) apollo app namespace type.  (require: ✅)
- ip `string` apollo app server ip  (require: ❎), [see docs](https://www.apolloconfig.com/#/zh/usage/other-language-client-user-guide?id=_12-%e9%80%9a%e8%bf%87%e5%b8%a6%e7%bc%93%e5%ad%98%e7%9a%84http%e6%8e%a5%e5%8f%a3%e4%bb%8eapollo%e8%af%bb%e5%8f%96%e9%85%8d%e7%bd%ae)

return

```ts
{
  'your_apollo_namespace_key': 'your_apollo_namespace_value'
}
```

- *Other than txt, which returns text, all formats are deserialized as objects.*

#### ApolloHttpClient getConfigNotifications 

> Call this method to initiate a long poll that listens to the specified namespace and receives updates back from the server.

```ts
const result = await httpClient.getConfigNotifications([
  {
    namespace: 'your_apollo_namespace',
    type: 'properties',
    ip: 'your_apollo_namespace_ip',
    id: 'your_apollo_notify_id',
  }
])
```

params

- namespace `string` apollo app namespace. (require: ✅)
- type [`NamespaceType`](#supported-configuration-types) apollo app namespace type.  (require: ✅)
- ip `string` apollo app server ip  (require: ❎), [see docs](https://www.apolloconfig.com/#/zh/usage/other-language-client-user-guide?id=_13-%e9%80%9a%e8%bf%87%e4%b8%8d%e5%b8%a6%e7%bc%93%e5%ad%98%e7%9a%84http%e6%8e%a5%e5%8f%a3%e4%bb%8eapollo%e8%af%bb%e5%8f%96%e9%85%8d%e7%bd%ae)
- id `number` the notify id (require: ❎)

return

```ts
[
  {
    namespaceName: 'your_apollo_namespace_name';
    notificationId: 'your_apollo_notify_id',
  },
]
```

#### ApolloThirdPartyHttpClient

#### ApolloThirdPartyHttpClient getConfig

#### ApolloThirdPartyHttpClient saveConfig

#### ApolloThirdPartyHttpClient deleteConfig

### ApolloConfigObserver

#### ApolloConfigObserver subscribe

#### ApolloConfigObserver unSubscribe

#### ApolloConfigObserver notify

#### ApolloConfigObserver polling

#### ApolloConfigObserver unPolling

### Use Client With Ark

### Supported Configuration types

- properties ✅
- yaml ✅
- yml ✅
- json ✅
- txt ✅
- xml ❎

## Questions

- [Discussions 🧐](https://github.com/vodyani/apollo-client/discussions)

## Team

|[![ChoGathK](https://github.com/chogathK.png?size=100)](https://github.com/chogathK)|
|:-:|
|[ChoGathK](https://github.com/chogathK)|

![Alt](https://repobeats.axiom.co/api/embed/ccfa27d0635b6ce8e3ca926fed5a017da7a23e24.svg "Repobeats analytics image")

## License

Vodyani apollo-client is [MIT licensed](LICENSE).
