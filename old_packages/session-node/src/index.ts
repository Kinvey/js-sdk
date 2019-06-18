import { setSessionStore } from '@kinveysdk/session';
import * as store from './store';

export function register(): void {
  setSessionStore(store);
}
