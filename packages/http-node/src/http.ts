import axios from 'axios';
import { HttpHeaders, HttpRequest, HttpResponse } from '@kinveysdk/http';
import { NetworkConnectionError, KinveyError } from '@kinveysdk/errors';

export async function send(request: HttpRequest): Promise<HttpResponse> {
  const { url, method, headers, body, timeout } = request;
  let axiosResponse;

  try {
    axiosResponse = await axios({
      headers: headers.toPlainObject(),
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
