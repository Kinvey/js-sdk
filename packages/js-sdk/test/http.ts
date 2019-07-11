import axios from 'axios';
import { HttpRequestObject, HttpResponseObject, setHttpAdapter } from '../src/http';
import { NetworkError, KinveyError } from '../src/errors';

const http = {
  async send(request: HttpRequestObject): Promise<HttpResponseObject> {
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
        throw new NetworkError(
          'The request was made but a response was not received.',
          'Please check your network connection.'
        );
      } else {
        throw new KinveyError(error.message);
      }
    }

    return {
      statusCode: axiosResponse.status,
      headers: axiosResponse.headers,
      data: axiosResponse.data
    };
  }
};

export function register(): void {
  setHttpAdapter(http);
}
