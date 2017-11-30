import { client, getAppVersion, setAppVersion, init, initialize, ping } from './kinvey';
import { Acl } from 'kinvey-acl';
import { Aggregation } from 'kinvey-aggregation';
import { AuthorizationGrant, MobileIdentityConnect } from 'kinvey-identity';
import { CustomEndpoint } from 'kinvey-endpoint';
import { DataStore, DataStoreType, SyncOperation } from 'kinvey-datastore';
import LiveService from 'kinvey-live';
import { Files } from 'kinvey-filestore';
import { Log as KinveyLog } from 'kinvey-log';
import { Metadata } from 'kinvey-metadata';
import { Query } from 'kinvey-query';
import { User } from 'kinvey-user';
import {
  ActiveUserError,
  APIVersionNotAvailableError,
  APIVersionNotImplementedError,
  AppProblemError,
  BadRequestError,
  BLError,
  CORSDisabledError,
  DuplicateEndUsersError,
  FeatureUnavailableError,
  IncompleteRequestBodyError,
  IndirectCollectionAccessDisallowedError,
  InsufficientCredentialsError,
  InvalidCredentialsError,
  InvalidIdentifierError,
  InvalidQuerySyntaxError,
  JSONParseError,
  KinveyError,
  KinveyInternalErrorRetry,
  KinveyInternalErrorStop,
  MissingQueryError,
  MissingRequestHeaderError,
  MissingRequestParameterError,
  MobileIdentityConnectError,
  NoActiveUserError,
  NetworkConnectionError,
  NoResponseError,
  NotFoundError,
  ParameterValueOutOfRangeError,
  PopupError,
  QueryError,
  ServerError,
  StaleRequestError,
  SyncError,
  TimeoutError,
  UserAlreadyExistsError,
  WritesToCollectionDisallowedError
} from 'kinvey-errors';
import { CacheRack, NetworkRack } from 'kinvey-request';
import { CacheMiddleware } from './cache';
import { HttpMiddleware } from './http';
import { Popup } from './popup';
import { Push } from './push';
import pkg from '../package.json';

// Setup racks
CacheRack.useCacheMiddleware(new CacheMiddleware());
NetworkRack.useHttpMiddleware(new HttpMiddleware(pkg));

// Setup popup
MobileIdentityConnect.usePopupClass(Popup);

module.exports = {
  client,
  getAppVersion,
  setAppVersion,
  init,
  initialize,
  ping,
  Acl,
  Aggregation,
  AuthorizationGrant,
  CustomEndpoint,
  DataStore,
  DataStoreType,
  SyncOperation,
  LiveService,
  Files,
  Log,
  Metadata,
  Query,
  User,
  Push,

  ActiveUserError,
  APIVersionNotAvailableError,
  APIVersionNotImplementedError,
  AppProblemError,
  BadRequestError,
  BLError,
  CORSDisabledError,
  DuplicateEndUsersError,
  FeatureUnavailableError,
  IncompleteRequestBodyError,
  IndirectCollectionAccessDisallowedError,
  InsufficientCredentialsError,
  InvalidCredentialsError,
  InvalidIdentifierError,
  InvalidQuerySyntaxError,
  JSONParseError,
  KinveyError,
  KinveyInternalErrorRetry,
  KinveyInternalErrorStop,
  MissingQueryError,
  MissingRequestHeaderError,
  MissingRequestParameterError,
  MobileIdentityConnectError,
  NoActiveUserError,
  NetworkConnectionError,
  NoResponseError,
  NotFoundError,
  ParameterValueOutOfRangeError,
  PopupError,
  QueryError,
  ServerError,
  StaleRequestError,
  SyncError,
  TimeoutError,
  UserAlreadyExistsError,
  WritesToCollectionDisallowedError
};
