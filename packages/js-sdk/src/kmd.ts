import isPlainObject from 'lodash/isPlainObject';
import { KinveyError } from './errors';

export interface KmdObject {
  local?: boolean;
  ect?: string;
  lmt?: string;
  authtoken?: string;
  emailVerification?: {
    status: string;
  };
}

export class Kmd {
  private kmd: KmdObject;

  constructor(kmd?: KmdObject) {
    if (kmd && !isPlainObject(kmd)) {
      throw new KinveyError('kmd must be an object.');
    }

    this.kmd = Object.assign({}, kmd);
  }

  get createdAt(): Date | undefined {
    if (this.kmd.ect) {
      return new Date(this.kmd.ect);
    }
    return undefined;
  }

  get updatedAt(): Date | undefined {
    if (this.kmd.lmt) {
      return new Date(this.kmd.lmt);
    }
    return undefined;
  }

  get authtoken(): string | undefined {
    return this.kmd.authtoken;
  }

  isEmailConfirmed(): boolean {
    if (this.kmd.emailVerification) {
      return this.kmd.emailVerification.status === 'confirmed';
    }
    return false;
  }

  isLocal(): boolean {
    return this.kmd.local === true;
  }
}
