import isPlainObject from 'lodash/isPlainObject';
import { KinveyError } from './errors';

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

export class Acl {
  private acl: AclObject;

  constructor(acl?: AclObject) {
    if (acl && !isPlainObject(acl)) {
      throw new KinveyError('acl must be an object.');
    }

    this.acl = Object.assign({}, acl);
  }

  get creator(): string {
    return this.acl.creator;
  }

  get readers(): string[] {
    const readers = [];
    if (this.acl.r) {
      return readers.concat(this.acl.r);
    }
    return readers;
  }

  get writers(): string[] {
    const writers = [];
    if (this.acl.w) {
      return writers.concat(this.acl.w);
    }
    return writers;
  }

  get readerGroups(): string[] {
    const readerGroups = [];
    if (this.acl.groups && this.acl.groups.r) {
      return readerGroups.concat(this.acl.groups.r);
    }
    return readerGroups;
  }

  get writerGroups(): string[] {
    const writerGroups = [];
    if (this.acl.groups && this.acl.groups.w) {
      return writerGroups.concat(this.acl.groups.w);
    }
    return writerGroups;
  }

  set globallyReadable(gr: boolean) {
    this.acl.gr = gr === true;
  }

  set globallyWritable(gw: boolean) {
    this.acl.gw = gw === true;
  }

  addReader(reader: string): Acl {
    const { readers } = this;
    if (readers.indexOf(reader) === -1) {
      readers.push(reader);
    }
    this.acl.r = readers;
    return this;
  }

  removeReader(reader: string): Acl {
    const { readers } = this;
    const index = readers.indexOf(reader);
    readers.splice(index, 1);
    this.acl.r = readers;
    return this;
  }

  addWriter(writer: string): Acl {
    const { writers } = this;
    if (writers.indexOf(writer) === -1) {
      writers.push(writer);
    }
    this.acl.w = writers;
    return this;
  }

  removeWriter(writer: string): Acl {
    const { writers } = this;
    const index = writers.indexOf(writer);
    writers.splice(index, 1);
    this.acl.w = writers;
    return this;
  }

  addReaderGroup(reader: string): Acl {
    const { readerGroups } = this;
    if (readerGroups.indexOf(reader) === -1) {
      readerGroups.push(reader);
    }
    this.acl.groups = Object.assign({}, this.acl.groups, { r: readerGroups });
    return this;
  }

  removeReaderGroup(reader: string): Acl {
    const { readerGroups } = this;
    const index = readerGroups.indexOf(reader);
    readerGroups.splice(index, 1);
    this.acl.groups = Object.assign({}, this.acl.groups, { r: readerGroups });
    return this;
  }

  addWriterGroup(writer: string): Acl {
    const { writerGroups } = this;
    if (writerGroups.indexOf(writer) === -1) {
      writerGroups.push(writer);
    }
    this.acl.groups = Object.assign({}, this.acl.groups, { w: writerGroups });
    return this;
  }

  removeWriterGroup(writer: string): Acl {
    const { writerGroups } = this;
    const index = writerGroups.indexOf(writer);
    writerGroups.splice(index, 1);
    this.acl.groups = Object.assign({}, this.acl.groups, { w: writerGroups });
    return this;
  }
}
