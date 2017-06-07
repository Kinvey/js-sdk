import { Request, RequestOptions } from './request';
import { NetworkRack } from '../rack';

export class NetworkRequest extends Request {
  constructor(options: RequestOptions) {
    super(options);
    this.rack = NetworkRack;
  }
}
