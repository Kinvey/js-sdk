import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import {
  APIVersionNotAvailableError,
  APIVersionNotImplementedError,
  AppNotFoundError,
  AppProblemError,
  BadRequestError,
  BLInternalError,
  BlobNotFoundError,
  BLRuntimeError,
  BLSyntaxError,
  BLTimeoutError,
  BLViolationError,
  CollectionNotFoundError,
  CORSDisabledError,
  DuplicateEndUsersError,
  EntityNotFoundError,
  FeatureUnavailableError,
  IncompleteRequestBodyError,
  IndirectCollectionAccessDisallowedError,
  InsufficientCredentialsError,
  InvalidCredentialsError,
  InvalidIdentifierError,
  InvalidQuerySyntaxError,
  JSONParseError,
  KinveyError,
  KinveyInternalErrorRetryError,
  KinveyInternalErrorStopError,
  MissingConfigurationError,
  MissingQueryError,
  MissingRequestHeaderError,
  MissingRequestParameterError,
  NotFoundError,
  ParameterValueOutOfRangeError,
  ResultSetSizeExceededError,
  ServerError,
  StaleRequestError,
  UserAlreadyExistsError,
  UserNotFoundError,
  WritesToCollectionDisallowedError,
} from '@progresskinvey/js-sdk-errors';
import { HttpHeaders, KinveyHttpHeaders } from './headers';
import { deserialize } from './utils';

export enum HttpStatusCode {
  Ok = 200,
  Created = 201,
  Empty = 204,
  MovedPermanently = 301,
  Found = 302,
  NotModified = 304,
  TemporaryRedirect = 307,
  PermanentRedirect = 308,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  ServerError = 500,
}

export interface HttpResponseObject {
  statusCode: number;
  headers?: { [name: string]: string };
  data?: any;
}

export interface HttpResponseConfig {
  statusCode: number;
  headers?: { [name: string]: string | string[] | (() => string | string[]) };
  data?: any;
}

export class HttpResponse {
  public statusCode: HttpStatusCode;
  public headers: HttpHeaders = new HttpHeaders();
  public data: any = {};

  constructor(config?: HttpResponseConfig) {
    if (config) {
      const { statusCode, headers, data } = config;
      this.statusCode = statusCode;
      this.headers = new HttpHeaders(headers);

      if (data) {
        if (isString(data)) {
          this.data = deserialize(this.headers.contentType, config.data);
        } else {
          this.data = config.data;
        }
      }
    }
  }

  isSuccess(): boolean {
    return (
      (this.statusCode >= 200 && this.statusCode < 300) ||
      this.statusCode === HttpStatusCode.MovedPermanently ||
      this.statusCode === HttpStatusCode.Found ||
      this.statusCode === HttpStatusCode.NotModified ||
      this.statusCode === HttpStatusCode.TemporaryRedirect ||
      this.statusCode === HttpStatusCode.PermanentRedirect
    );
  }

  toPlainObject(): HttpResponseObject {
    return {
      statusCode: this.statusCode,
      headers: this.headers.toPlainObject(),
      data: this.data,
    };
  }
}

export class KinveyHttpResponse extends HttpResponse {
  public headers: KinveyHttpHeaders = new KinveyHttpHeaders();

  constructor(config?: HttpResponseConfig) {
    super(config);

    if (config) {
      this.headers = new KinveyHttpHeaders(config.headers);
    }
  }

  get error(): Error | null {
    if (!this.isSuccess()) {
      if (isPlainObject(this.data)) {
        const message = this.data.message || this.data.description;
        const name = this.data.name || this.data.error;
        const { debug } = this.data;

        switch (name) {
          case 'APIVersionNotAvailable':
            return new APIVersionNotAvailableError(message, debug);
          case 'APIVersionNotImplemented':
            return new APIVersionNotImplementedError(message, debug);
          case 'AppProblem':
            return new AppProblemError(message, debug);
          case 'BadRequest':
            return new BadRequestError(message, debug);
          case 'BLInternalError':
            return new BLInternalError(message, debug);
          case 'BLRuntimeError':
            return new BLRuntimeError(message, debug);
          case 'BLSyntaxError':
            return new BLSyntaxError(message, debug);
          case 'BLTimeoutError':
            return new BLTimeoutError(message, debug);
          case 'BLViolationError':
            return new BLViolationError(message, debug);
          case 'CORSDisabled':
            return new CORSDisabledError(message, debug);
          case 'DuplicateEndUsers':
            return new DuplicateEndUsersError(message, debug);
          case 'FeatureUnavailable':
            return new FeatureUnavailableError(message, debug);
          case 'IncompleteRequestBody':
            return new IncompleteRequestBodyError(message, debug);
          case 'IndirectCollectionAccessDisallowed':
            return new IndirectCollectionAccessDisallowedError(message, debug);
          case 'InsufficientCredentials':
            return new InsufficientCredentialsError(message, debug);
          case 'InvalidCredentials':
            return new InvalidCredentialsError(message, debug);
          case 'InvalidIdentifier':
            return new InvalidIdentifierError(message, debug);
          case 'InvalidQuerySyntax':
            return new InvalidQuerySyntaxError(message, debug);
          case 'JSONParseError':
            return new JSONParseError(message, debug);
          case 'KinveyInternalErrorRetry':
            return new KinveyInternalErrorRetryError(message, debug);
          case 'KinveyInternalErrorStop':
            return new KinveyInternalErrorStopError(message, debug);
          case 'MissingQuery':
            return new MissingQueryError(message, debug);
          case 'MissingRequestHeader':
            return new MissingRequestHeaderError(message, debug);
          case 'MissingRequestParameter':
            return new MissingRequestParameterError(message, debug);
          case 'MissingConfiguration':
            return new MissingConfigurationError(message, debug);
          case 'EntityNotFound':
            return new EntityNotFoundError(message, debug);
          case 'CollectionNotFound':
            return new CollectionNotFoundError(message, debug);
          case 'AppNotFound':
            return new AppNotFoundError(message, debug);
          case 'UserNotFound':
            return new UserNotFoundError(message, debug);
          case 'BlobNotFound':
            return new BlobNotFoundError(message, debug);
          case 'ParameterValueOutOfRange':
            return new ParameterValueOutOfRangeError(message, debug);
          case 'ResultSetSizeExceeded':
            return new ResultSetSizeExceededError(message, debug);
          case 'ServerError':
            return new ServerError(message, debug);
          case 'StaleRequest':
            return new StaleRequestError(message, debug);
          case 'UserAlreadyExists':
            return new UserAlreadyExistsError(message, debug);
          case 'WritesToCollectionDisallowed':
            return new WritesToCollectionDisallowedError(message, debug);
          default:
            if (this.statusCode === HttpStatusCode.Unauthorized || this.statusCode === HttpStatusCode.Forbidden) {
              return new InsufficientCredentialsError(message, debug);
            }

            if (this.statusCode === HttpStatusCode.NotFound) {
              return new NotFoundError(message, debug);
            }

            if (this.statusCode === HttpStatusCode.ServerError) {
              return new ServerError(message, debug);
            }

            return new KinveyError(message, debug);
        }
      }
    }

    return null;
  }
}
