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

