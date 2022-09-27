import { Injectable } from '@nestjs/common';
import { This } from '@vodyani/class-decorator';
import { Client } from '@vodyani/core';

import { ApolloClientOptions } from '../common';
import { ApolloClient } from '../struct';

@Injectable()
export class ApolloClientProvider implements Client {
  private instance: ApolloClient;

  constructor(options: ApolloClientOptions) {
    this.instance = new ApolloClient(options);
  }

  @This
  public getInstance() {
    return this.instance;
  }

  @This
  public close() {
    this.instance = null;
  }
}
