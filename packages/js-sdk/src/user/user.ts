import { Session } from '../session';
import { AclObject } from '../acl';

export interface UserData extends Session {
  _acl?: AclObject;
  email?: string;
  username?: string;
  password?: string;
}

export class User<T extends UserData> {
  public data: T;

  constructor(data: T) {
    this.data = data;
  }
}
