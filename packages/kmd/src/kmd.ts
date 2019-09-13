import isPlainObject from 'lodash/isPlainObject';

export interface KmdObject {
  local?: boolean;
  authtoken?: string;
  ect?: string;
  lmt?: string;
  emailVerification?: {
    status: string;
  };
}

export interface Entity {
  _kmd?: KmdObject;
}

/**
 * This class provides a way to access the KMD (Kinvey Metadata)
 * information for an entity.
 */
export class Kmd {
  private entity: Entity;

  constructor(entity: Entity) {
    if (!isPlainObject(entity)) {
      throw new Error('entity argument must be an object');
    }

    entity._kmd = entity._kmd || {}; // eslint-disable-line no-param-reassign
    this.entity = entity;
  }

  /**
   * Get the auth token.
   *
   * @returns {string} _kmd.authtoken
   */
  get authtoken(): string | null {
    return (this.entity._kmd && this.entity._kmd.authtoken) || null;
  }

  /**
   * Get created at time.
   *
   * @returns {Date?} _kmd.ect
   */
  get ect(): Date | undefined {
    return this.createdAt;
  }

  /**
   * Get created at time.
   *
   * @returns {Date?} _kmd.ect
   */
  get createdAt(): Date | undefined {
    if (this.entity._kmd && this.entity._kmd.ect) {
      return new Date(this.entity._kmd.ect);
    }

    return undefined;
  }

  /**
   * Get last modified time.
   *
   * @returns {Date?} _kmd.lmt
   */
  get lmt(): Date | undefined {
    return this.updatedAt;
  }

  /**
   * Get last modified time.
   *
   * @returns {Date?} _kmd.lmt
   */
  get lastModified(): Date | undefined {
    return this.updatedAt;
  }

  /**
   * Get last modified time.
   *
   * @returns {Date?} _kmd.lmt
   */
  get updatedAt(): Date | undefined {
    if (this.entity._kmd && this.entity._kmd.lmt) {
      return new Date(this.entity._kmd.lmt);
    }

    return undefined;
  }

  /**
   * Get the email verification details.
   *
   * @returns {Object} _kmd.emailVerification
   */
  get emailVerification(): { status: string } | undefined {
    if (this.entity._kmd && this.entity._kmd.emailVerification) {
      return this.entity._kmd.emailVerification;
    }

    return undefined;
  }

  /**
   * Checks if an email for a user has been confirmed.
   *
   * @returns {boolean} True if the email has been confirmed otherwise false
   */
  isEmailConfirmed(): boolean {
    if (this.emailVerification) {
      return this.emailVerification.status === 'confirmed';
    }

    return false;
  }

  /**
   * Checks if the entity has been created locally.
   *
   * @returns {boolean} True if the entity has been created locally otherwise false
   */
  isLocal(): boolean {
    return (this.entity._kmd && this.entity._kmd.local === true) || false;
  }

  toPlainObject(): KmdObject {
    return this.entity._kmd;
  }
}
