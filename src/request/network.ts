import { Request, RequestOptions } from './';
import { NetworkRack } from '../rack';

export class NetworkRequest extends Request {
  constructor(options: RequestOptions) {
    super(options);
    this.rack = NetworkRack;
  }
}
