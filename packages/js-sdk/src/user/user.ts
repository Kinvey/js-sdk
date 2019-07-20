import { Session, setSession, getSession, removeSession } from '../session';
import { AclObject, Acl } from '../acl';
import { Kmd } from '../kmd';
import {
  KinveyHttpRequest,
  HttpRequestMethod,
  formatKinveyBaasUrl,
  KinveyBaasNamespace,
  kinveySessionAuth
} from '../http';

export interface PushToken {
  token: string;
  platform: string;
  arn: string;
  framework?: string;
}

export interface UserData extends Session {
  _acl?: AclObject;
  email?: string;
  username?: string;
  _messaging?: {
    pushTokens: PushToken[];
  };
}

export class User<T extends UserData> {
  public data: T;

  constructor(data: T) {
    this.data = data;
  }

  get _id(): string | undefined {
    if (this.data) {
      return this.data._id;
    }
    return undefined;
  }

  get _acl(): Acl | undefined {
    if (this.data) {
      return new Acl(this.data._acl);
    }
    return undefined;
  }

  get _kmd(): Kmd | undefined {
    if (this.data) {
      return new Kmd(this.data._kmd);
    }
    return undefined;
  }

  get authtoken(): string | undefined {
    const kmd = this._kmd;
    if (kmd) {
      return kmd.authtoken;
    }
    return undefined;
  }

  get username(): string | undefined {
    if (this.data) {
      return this.data.username;
    }
    return undefined;
  }

  get email(): string | undefined {
    if (this.data) {
      return this.data.email;
    }
    return undefined;
  }

  isActive(): boolean {
    const activeUser = getSession();
    if (activeUser && activeUser._id === this._id) {
      return true;
    }
    return false;
  }

  isEmailConfirmed(): boolean {
    if (this._kmd) {
      return this._kmd.isEmailConfirmed();
    }
    return false;
  }

  async me(options: { timeout?: number } = {}): Promise<this> {
    const request = new KinveyHttpRequest({
      method: HttpRequestMethod.GET,
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/_me'),
      timeout: options.timeout
    });
    const response = await request.execute();
    const { data } = response.data;

    // Remove sensitive data
    delete data.password;

    // Update the active session
    if (this.isActive()) {
      setSession(data);
    }

    this.data = data;
    return this;
  }

  async logout(options: { timeout?: number } = {}): Promise<this> {
    if (this.isActive()) {
      // Logout
      const request = new KinveyHttpRequest({
        method: HttpRequestMethod.POST,
        auth: kinveySessionAuth,
        url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/_logout'),
        timeout: options.timeout
      });
      await request.execute();

      // Remove the session
      removeSession();

      // TODO: unregister push
      // TODO: Unregister from Live Service
      // TODO: clear the cache
    }

    return this;
  }
}
