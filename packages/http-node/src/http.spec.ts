/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
/* eslint @typescript-eslint/explicit-function-return-type: "off" */

import test from 'ava';
import { HttpRequest, HttpResponse } from '@kinveysdk/http';
import { NodeJSHttpAdapter } from './http';

test('foo', async t => {
  const adapter = new NodeJSHttpAdapter();
  const response = await adapter.send(new HttpRequest());
  t.is(response, new HttpResponse());
});

test('bar', async t => {
  const bar = Promise.resolve('bar');
  t.is(await bar, 'bar');
});
