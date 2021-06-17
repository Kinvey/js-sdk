function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const InAppBrowserMock = {
  isAvailable: jest.fn().mockReturnValue(true),
  openAuth: jest.fn().mockImplementation(url => delay(100).then(() => ({ type: 'success', url }))), // Wait for the event handlers to be attached
}

jest.mock('react-native-inappbrowser-reborn', () => ({
  InAppBrowser: InAppBrowserMock
}));

import { EventEmitter } from 'events';
// import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { open } from '../src/popup';

describe('popup for MIC login', () => {
  const testUrl = 'http://example.com'

  describe('open()', () => {
    test('should throw an error if in-app browser not available', async () => {
      InAppBrowserMock.isAvailable.mockReturnValueOnce(false);
      
      await expect(open(testUrl)).rejects.toEqual(new Error('In-app browser not available.'));
    });

    test('should return a popup window', async () => {
      const popupPromise = open(testUrl);
      expect(popupPromise instanceof Promise).toBe(true);

      const popup = await popupPromise;
      expect(popup instanceof EventEmitter).toBe(true);
      expect(popup.isClosed()).toBe(false);
    });

    test('should emit loaded event on success', async () => {
      const handlerMock = jest.fn();
      await open(testUrl).then(popup => popup.onLoaded(handlerMock));

      await delay(100);
      expect(handlerMock.mock.calls.length).toBe(1);
      expect(handlerMock.mock.calls[0][0]).toEqual({ url: testUrl });
    });

    test('should emit loaded event on success but without url in the result', async () => {
      InAppBrowserMock.openAuth.mockReturnValueOnce(delay(100).then(() => ({ type: 'success' })));

      const handlerMock = jest.fn();
      await open(testUrl).then(popup => popup.onLoaded(handlerMock));

      await delay(100);
      expect(handlerMock.mock.calls.length).toBe(0);
    });

    test('should not emit loaded event on dismiss', async () => {
      InAppBrowserMock.openAuth.mockReturnValueOnce(delay(100).then(() => ({ type: 'dismiss' })));

      const handlerMock = jest.fn();
      await open(testUrl).then(popup => popup.onLoaded(handlerMock));

      await delay(100);
      expect(handlerMock.mock.calls.length).toBe(0);
    });
  });
});
