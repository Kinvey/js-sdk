import { getAppKey } from './init';
import { Storage, Doc } from './storage';

const COLLECTION_NAME = '_Device';

function s4(): string {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function uuidv4(): string {
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

export interface DeviceDoc extends Doc {
  uuid: string;
}

export async function getDeviceId(): Promise<string> {
  const storage = new Storage<DeviceDoc>(getAppKey(), COLLECTION_NAME);
  const docs = await storage.find();
  let doc = docs.shift();
  if (!doc) {
    doc = await storage.save({ uuid: uuidv4() });
  }
  return doc.uuid;
}

export enum NetworkType {
  None,
  Unknown,
  Cellular,
  Wifi,
  Bluetooth,
  Ethernet,
  WiMax,
  VPN,
  Other
}

export interface DeviceState {
  network: {
    connected: boolean;
    type?: NetworkType;
  }
}

const state: DeviceState = { network: { connected: true }};

export function isNetworkConnected(): boolean {
  return state.network.connected;
}

export function setNetworkConnected(connected: boolean): void {
  state.network.connected = connected === true;
}

export function getNetworkType(): NetworkType | undefined {
  return state.network.type;
}

export function setNetworkType(type: NetworkType): void {
  state.network.type = type;
}

