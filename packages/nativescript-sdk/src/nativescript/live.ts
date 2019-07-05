import * as application from 'tns-core-modules/application';
import * as connectivityModule from 'tns-core-modules/connectivity';
import * as live from 'kinvey-js-sdk/lib/live';
let currentConnectionType = connectivityModule.getConnectionType();

export function startMonitoring() {
  // Reconnect live service on the application resume event
  application.off(application.resumeEvent);
  application.on(application.resumeEvent, () => {
    if (application.ios) {
      live.reconnect();
    }
  });

  // Monitor network connectivity and reconnect live service when necessary
  connectivityModule.stopMonitoring();
  connectivityModule.startMonitoring((newConnectionType) => {
    if (currentConnectionType === connectivityModule.connectionType.none && (newConnectionType === connectivityModule.connectionType.wifi || newConnectionType === connectivityModule.connectionType.mobile)) {
      live.reconnect();
    }

    currentConnectionType = newConnectionType;
  });
}

export function stopMonitoring() {
  application.off(application.resumeEvent);
  connectivityModule.stopMonitoring();
}
