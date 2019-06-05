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
export declare class Acl {
    private acl;
    constructor(acl?: AclObject);
    readonly creator: string;
    readonly readers: string[];
    readonly writers: string[];
    readonly readerGroups: string[];
    readonly writerGroups: string[];
    globallyReadable: boolean;
    globallyWritable: boolean;
    addReader(reader: string): Acl;
    removeReader(reader: string): Acl;
    addWriter(writer: string): Acl;
    removeWriter(writer: string): Acl;
    addReaderGroup(reader: string): Acl;
    removeReaderGroup(reader: string): Acl;
    addWriterGroup(writer: string): Acl;
    removeWriterGroup(writer: string): Acl;
}
