export interface Adapter {
  find(collection: string): Promise<{}[]>;
  findById(collection: string, id: string): Promise<{}>;
  save(collection: string, entities: {}[]): Promise<{}[]>;
  removeById(collection: string, id: string): Promise<{ count: number }>;
  clear(): Promise<{ count: number }>;
}