import axios from 'axios';
import {
  setHttpAdapter,
  HttpRequestObject,
  HttpResponseObject,
  NetworkError,
  KinveyError
} from 'kinvey-js-sdk';

export const http = {
  async send(request: HttpRequestObject): Promise<HttpResponseObject> {
    const { url, method, headers, body, timeout } = request;
    let response;

    try {
      response = await axios({
        headers,
        method,
        url,
        data: body,
        timeout
      });
    } catch (error) {
      if (error.response) {
        // eslint-disable-next-line prefer-destructuring
        response = error.response;
      } else if (error.request) {
        throw new NetworkError('The request was made but a response was not received.', 'Please check your network connection.');
      } else {
        throw new KinveyError(error.message);
      }
    }

    return {
      statusCode: response.status,
      headers: response.headers,
      data: response.data
    };
  }
};

export function register(): void {
  setHttpAdapter(http);
}
