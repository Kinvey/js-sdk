import { setHttpAdapter } from '@kinveysdk/http';
import * as http from './http';

export function register(): void {
  setHttpAdapter(http);
}
