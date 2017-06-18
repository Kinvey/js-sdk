import isPlainObject = require('lodash/isPlainObject');

import { KinveyError } from '../errors';
import { isDefined } from '../utils/object';

/**
 * The Metadata class is used to as a wrapper for accessing the `_kmd` properties of an entity.
 */
export class Metadata {
  private entity: any;

  constructor(entity: any) {
    if (isPlainObject(entity) === false) {
      throw new KinveyError('entity argument must be an object');
    }

    entity._kmd = entity._kmd || {};
    this.entity = entity;
  }

  get createdAt() {
    if (isDefined(this.entity._kmd.ect)) {
      return new Date(this.entity._kmd.ect);
    }

    return undefined;
  }

  get ect() {
    return this.createdAt;
  }

  get emailVerification() {
    if (isDefined(this.entity._kmd.emailVerification)) {
      return this.entity._kmd.emailVerification.status;
    }

    return undefined;
  }

  get lastModified() {
    if (isDefined(this.entity._kmd.lmt)) {
      return new Date(this.entity._kmd.lmt);
    }

    return undefined;
  }

  get lmt() {
    return this.lastModified;
  }

  get authtoken() {
    return this.entity._kmd.authtoken;
  }

  isLocal() {
    return this.entity._kmd.local === true;
  }

  toPlainObject() {
    return this.entity._kmd;
  }
}
