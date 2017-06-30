export interface Entity {
  _id: string;
  _acl?: {
    creator?: string;
  },
  _kmd?: {
    lmt?: string;
    ect?: string;
  };
}