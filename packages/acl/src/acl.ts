import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';

export interface AclObject {
  gr?: boolean;
  gw?: boolean;
  creator?: string;
  r?: string[];
  w?: string[];
  groups?: {
    r?: string[];
    w?: string[];
  };
}

export interface Entity {
  _acl?: AclObject;
}

/**
 * This class provides a way to access the ACL (Access Control List)
 * information for an entity and to modify the access control permissions.
 */
export class Acl {
  private entity: Entity;

  constructor(entity: Entity) {
    if (!isPlainObject(entity)) {
      throw new Error('entity must be an object.');
    }

    entity._acl = entity._acl || {}; // eslint-disable-line no-param-reassign
    this.entity = entity;
  }

  /**
   * Get the creator.
   *
   * @returns {string} Creator
   */
  get creator(): string | null {
    return (this.entity._acl && this.entity._acl.creator) || null;
  }

  /**
   * Get the readers.
   *
   * @returns {string[]} Readers
   */
  get readers(): string[] {
    return this.entity._acl && isArray(this.entity._acl.r) ? this.entity._acl.r : [];
  }

  /**
   * Get the writers.
   *
   * @returns {string[]} Writers
   */
  get writers(): string[] {
    return this.entity._acl && isArray(this.entity._acl.w) ? this.entity._acl.w : [];
  }

  /**
   * Get the reader groups.
   *
   * @returns {string[]} Reader groups
   */
  get readerGroups(): string[] {
    return this.entity._acl && this.entity._acl.groups && isArray(this.entity._acl.groups.r)
      ? this.entity._acl.groups.r
      : [];
  }

  /**
   * Get the writer groups.
   *
   * @returns {string[]} Writer groups
   */
  get writerGroups(): string[] {
    return this.entity._acl && this.entity._acl.groups && isArray(this.entity._acl.groups.w)
      ? this.entity._acl.groups.w
      : [];
  }

  /**
   * Set the globally readable permission.
   *
   * @param {boolean} gr Globally readable
   */
  set globallyReadable(gr: boolean) {
    if (!this.entity._acl) {
      this.entity._acl = {};
    }
    this.entity._acl.gr = gr === true;
  }

  /**
   * Set the globally writable permission.
   *
   * @param {boolean} gw Globally writable
   */
  set globallyWritable(gw: boolean) {
    if (!this.entity._acl) {
      this.entity._acl = {};
    }
    this.entity._acl.gw = gw === true;
  }

  /**
   * Add a reader.
   *
   * @param {string} reader Reader
   * @returns {Acl} Acl
   */
  addReader(reader: string): this {
    const r = this.readers;

    if (r.indexOf(reader) === -1) {
      r.push(reader);
    }

    if (!this.entity._acl) {
      this.entity._acl = {};
    }

    this.entity._acl.r = r;
    return this;
  }

  /**
   * Add a reader group.
   *
   * @param {string} group Reader group
   * @returns {Acl} Acl
   */
  addReaderGroup(group: string): this {
    const groups = this.readerGroups;

    if (groups.indexOf(group) === -1) {
      groups.push(group);
    }

    if (!this.entity._acl) {
      this.entity._acl = {};
    }

    this.entity._acl.groups = Object.assign({}, this.entity._acl.groups, { r: groups });
    return this;
  }

  /**
   * Add a writer.
   *
   * @param {string} writer Writer
   * @returns {Acl} Acl
   */
  addWriter(writer: string): this {
    const w = this.writers;

    if (w.indexOf(writer) === -1) {
      w.push(writer);
    }

    if (!this.entity._acl) {
      this.entity._acl = {};
    }

    this.entity._acl.w = w;
    return this;
  }

  /**
   * Add a writer group.
   *
   * @param {string} group Writer group
   * @returns {Acl} Acl
   */
  addWriterGroup(group: string): this {
    const groups = this.writerGroups;

    if (groups.indexOf(group) === -1) {
      groups.push(group);
    }

    if (!this.entity._acl) {
      this.entity._acl = {};
    }

    this.entity._acl.groups = Object.assign({}, this.entity._acl.groups, { w: groups });
    return this;
  }

  /**
   * Check if globally readable is allowed.
   *
   * @returns {boolean} True if globally readable is allowed otherwise false
   */
  isGloballyReadable(): boolean {
    return (this.entity._acl && this.entity._acl.gr === true) || false;
  }

  /**
   * Check if globally writable is allowed.
   *
   * @returns {boolean} True if globally writable is allowed otherwise false
   */
  isGloballyWritable(): boolean {
    return (this.entity._acl && this.entity._acl.gw === true) || false;
  }

  /**
   * Remove a reader.
   *
   * @param {string} reader Reader
   * @returns {Acl} Acl
   */
  removeReader(reader: string): this {
    const r = this.readers;
    const index = r.indexOf(reader);

    if (index !== -1) {
      r.splice(index, 1);
    }

    if (!this.entity._acl) {
      this.entity._acl = {};
    }

    this.entity._acl.r = r;
    return this;
  }

  /**
   * Remove a reader group.
   *
   * @param {string} group Reader group
   * @returns {Acl} Acl
   */
  removeReaderGroup(group: string): this {
    const groups = this.readerGroups;
    const index = groups.indexOf(group);

    if (index !== -1) {
      groups.splice(index, 1);
    }

    if (!this.entity._acl) {
      this.entity._acl = {};
    }

    this.entity._acl.groups = Object.assign({}, this.entity._acl.groups, { r: groups });
    return this;
  }

  /**
   * Remove a writer.
   *
   * @param {string} writer Writer
   * @returns {Acl} Acl
   */
  removeWriter(writer: string): this {
    const w = this.writers;
    const index = w.indexOf(writer);

    if (index !== -1) {
      w.splice(index, 1);
    }

    if (!this.entity._acl) {
      this.entity._acl = {};
    }

    this.entity._acl.w = w;
    return this;
  }

  /**
   * Remove a writer group.
   *
   * @param {string} group Writer group
   * @returns {Acl} Acl
   */
  removeWriterGroup(group: string): this {
    const groups = this.writerGroups;
    const index = groups.indexOf(group);

    if (index !== -1) {
      groups.splice(index, 1);
    }

    if (!this.entity._acl) {
      this.entity._acl = {};
    }

    this.entity._acl.groups = Object.assign({}, this.entity._acl.groups, { w: groups });
    return this;
  }

  /**
   * The acl as a plain object.
   *
   * @returns {Object} Acl as a plain object.
   */
  toPlainObject(): AclObject {
    return this.entity._acl;
  }
}
