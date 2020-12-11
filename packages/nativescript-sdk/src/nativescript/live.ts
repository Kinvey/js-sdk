import { Application, isIOS, Connectivity } from '@nativescript/core';
import * as live from 'kinvey-js-sdk/lib/live';
let currentConnectionType = Connectivity.getConnectionType();

export function startMonitoring() {
  // Reconnect live service on the application resume event
  Application.off(Application.resumeEvent);
  Application.on(Application.resumeEvent, () => {
    if (isIOS) {
      live.reconnect();
    }
  });

  // Monitor network connectivity and reconnect live service when necessary
  Connectivity.stopMonitoring();
  Connectivity.startMonitoring((newConnectionType) => {
    if (currentConnectionType === Connectivity.connectionType.none && (newConnectionType === Connectivity.connectionType.wifi || newConnectionType === Connectivity.connectionType.mobile)) {
      live.reconnect();
    }

    currentConnectionType = newConnectionType;
  });
}

export function stopMonitoring() {
  Application.off(Application.resumeEvent);
  Connectivity.stopMonitoring();
}
