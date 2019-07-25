import { init as initSdk, KinveySDKConfig } from "kinvey-js-sdk/lib/init";
import { register as registerHttp } from "./http";
import { startMonitoringNetworkState } from "./device";

export { KinveySDKConfig } from "kinvey-js-sdk/lib/init";

export function init(config: KinveySDKConfig): void {
  registerHttp();
  startMonitoringNetworkState();
  initSdk(config);
}
