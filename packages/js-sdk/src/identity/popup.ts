import { EventEmitter } from 'events';
import { KinveyError } from '../errors';

export interface PopupEvent {
  url?: string;
}

export interface PopupWindow extends EventEmitter {
  isClosed(): boolean;
  onLoaded(listener: (event: PopupEvent) => void): this;
  onClosed(listener: () => void): this;
  onError(listener: () => void): this;
  close(): Promise<void>;
}

export interface PopupAdapter {
  open(url: string): Promise<PopupWindow>;
}

let adapter: PopupAdapter;

export function getPopupAdapter(): PopupAdapter {
  return adapter;
}

export function setPopupAdapter(_adapter: PopupAdapter): void {
  adapter = _adapter;
}

export function open(url: string): Promise<PopupWindow> {
  const popupAdapter = getPopupAdapter();
  if (!popupAdapter) {
    throw new KinveyError('You must override the default storage adapter with a platform specific storage adapter.');
  }
  return popupAdapter.open(url);
}
