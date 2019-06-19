import { addEventListener, NetInfoStateType, NetInfoSubscription } from '@react-native-community/netinfo';
import { setNetworkConnected, setNetworkType, NetworkType } from 'kinvey-js-sdk/lib/device';

let networkStateSubscription: NetInfoSubscription;

export function startMonitoringNetworkState(): void {
  if (!networkStateSubscription) {
    networkStateSubscription = addEventListener((state): void => {
      setNetworkConnected(state.isConnected);
      switch (state.type) {
        case NetInfoStateType.none:
          setNetworkType(NetworkType.None);
          break;
        case NetInfoStateType.cellular:
          setNetworkType(NetworkType.Cellular);
          break;
        case NetInfoStateType.wifi:
          setNetworkType(NetworkType.Wifi);
          break;
        case NetInfoStateType.bluetooth:
          setNetworkType(NetworkType.Bluetooth);
          break;
        case NetInfoStateType.ethernet:
          setNetworkType(NetworkType.Ethernet);
          break;
        case NetInfoStateType.wimax:
          setNetworkType(NetworkType.WiMax);
          break;
        case NetInfoStateType.vpn:
          setNetworkType(NetworkType.VPN);
          break;
        case NetInfoStateType.unknown:
        default:
          setNetworkType(NetworkType.Unknown);
          break;
      }
    });
  }
}

export function stopMonitoringNetworkState(): void {
  if (networkStateSubscription) {
    networkStateSubscription();
  }
}
