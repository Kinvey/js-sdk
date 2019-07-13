import { KinveyHttpRequest, HttpRequestMethod, formatKinveyBaasUrl, KinveyBaasNamespace, kinveyAppAuth } from '../http';
import { User, UserData } from '../user';

export interface SignupOptions {
  timeout?: number;
}

export async function signup<T extends UserData>(data?: any, options: SignupOptions = {}): Promise<User<T>> {
  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: kinveyAppAuth,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.User),
    body: data,
    timeout: options.timeout
  });
  const response = await request.execute();
  const session = response.data;

  // Remove sensitive data
  delete session.password;

  // Return the user
  return new User<T>(session);
}
