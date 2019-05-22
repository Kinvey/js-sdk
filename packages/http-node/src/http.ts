import axios from 'axios';
import { setHttpAdapter, HttpHeaders, HttpRequest, HttpResponse, HttpAdapter } from '@kinveysdk/http';
import { NetworkConnectionError, KinveyError } from '@kinveysdk/errors';

export class NodeJSHttpAdapter implements HttpAdapter {
  async send(request: HttpRequest): Promise<HttpResponse> {
    const { url, method, headers, body, timeout } = request;
    let axiosResponse;

    try {
      axiosResponse = await axios({
        headers,
        method,
        url,
        data: body,
        timeout
      });
    } catch (error) {
      if (error.response) {
        axiosResponse = error.response;
      } else if (error.request) {
        throw new NetworkConnectionError('The request was made but a response was not received.', 'Please check your network connection.');
      } else {
        throw new KinveyError(error.message);
      }
    }

    return new HttpResponse({
      statusCode: axiosResponse.status,
      headers: HttpHeaders.fromHeaders(axiosResponse.headers),
      data: axiosResponse.data
    });
  }
}

export function register(): void {
  const httpAdapter = new NodeJSHttpAdapter();
  setHttpAdapter(httpAdapter);
}
