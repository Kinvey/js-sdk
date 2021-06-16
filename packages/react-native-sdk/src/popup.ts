import { EventEmitter } from 'events';
import { Linking } from 'react-native'
import { InAppBrowser } from 'react-native-inappbrowser-reborn'

const LOADED_EVENT = 'loaded';
const CLOSED_EVENT = 'closed';
const ERROR_EVENT = 'error';

class PopupBrowser extends EventEmitter {
  private isOpen: boolean;
  private authPromise: Promise<any>;

  isClosed() {
    return !this.isOpen;
  }

  onLoaded(listener: (...args: any[]) => void) {
    return this.on(LOADED_EVENT, listener);
  }

  onClosed(listener: (...args: any[]) => void) {
    return this.on(CLOSED_EVENT, listener);
  }

  onError(listener: (...args: any[]) => void) {
    return this.on(ERROR_EVENT, listener);
  }

  async open(url: string): Promise<PopupBrowser> {
    if (await InAppBrowser.isAvailable() == false) {
      throw new Error('In-app browser not available.');
    }

    this.isOpen = true;
    this.authPromise = InAppBrowser.openAuth(url, null)
      .then((authResult) => {
        const loadedArgs = { url };
        if (authResult.type === 'success' && authResult.url) {
          loadedArgs.url = authResult.url; // Provide the full url containing the auth code
        }
        this.emit(LOADED_EVENT, loadedArgs);
      })
      .catch((err) => {
        this.emit(ERROR_EVENT, err);
      });

    return this;
  }

  async close(): Promise<void> {
    this.isOpen = false;
    this.authPromise = null;
    this.emit(CLOSED_EVENT);
  }
}

export async function open(url: string): Promise<PopupBrowser> {
  const popup = new PopupBrowser();
  return popup.open(url);
}
