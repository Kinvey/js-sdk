import { Session } from '../session';
import { AclObject } from '../acl';
export interface UserData extends Session {
    _acl?: AclObject;
    email?: string;
    username?: string;
    password?: string;
}
export declare class User<T extends UserData> {
    data: T;
    constructor(data: T);
}
