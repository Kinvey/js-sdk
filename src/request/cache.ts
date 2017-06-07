import { Request, RequestOptions } from './request';
import { KinveyResponse } from './response';
import { CacheRack } from '../rack';

export class CacheRequest extends Request {
  constructor(options: RequestOptions) {
    super(options);
    this.rack = CacheRack;
  }
}
