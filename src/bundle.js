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
  NetworkConnectionError,
  NoActiveUserError,
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
} from 'src/errors';
import { Log } from 'src/utils';
import { CustomEndpoint } from './endpoint';
import { Query } from './query';
import { Aggregation } from './aggregation';
import { DataStore, DataStoreType, FileStore, SyncOperation } from './datastore';
import { Acl, Metadata, User } from './entity';
import { AuthorizationGrant } from './identity';
import { CacheRack, NetworkRack, Rack } from './request';
import { Kinvey } from './kinvey';

// Add modules
Kinvey.Acl = Acl;
Kinvey.Aggregation = Aggregation;
Kinvey.AuthorizationGrant = AuthorizationGrant;
Kinvey.CustomEndpoint = CustomEndpoint;
Kinvey.DataStore = DataStore;
Kinvey.DataStoreType = DataStoreType;
Kinvey.Files = new FileStore();
Kinvey.Group = Aggregation;
Kinvey.Log = Log;
Kinvey.Metadata = Metadata;
Kinvey.Query = Query;
Kinvey.SyncOperation = SyncOperation;
Kinvey.User = User;

// Add errors
Kinvey.ActiveUserError = ActiveUserError;
Kinvey.APIVersionNotAvailableError = APIVersionNotAvailableError;
Kinvey.APIVersionNotImplementedError = APIVersionNotImplementedError;
Kinvey.AppProblemError = AppProblemError;
Kinvey.BadRequestError = BadRequestError;
Kinvey.BLError = BLError;
Kinvey.CORSDisabledError = CORSDisabledError;
Kinvey.DuplicateEndUsersError = DuplicateEndUsersError;
Kinvey.FeatureUnavailableError = FeatureUnavailableError;
Kinvey.IncompleteRequestBodyError = IncompleteRequestBodyError;
Kinvey.IndirectCollectionAccessDisallowedError = IndirectCollectionAccessDisallowedError;
Kinvey.InsufficientCredentialsError = InsufficientCredentialsError;
Kinvey.InvalidCredentialsError = InvalidCredentialsError;
Kinvey.InvalidIdentifierError = InvalidIdentifierError;
Kinvey.InvalidQuerySyntaxError = InvalidQuerySyntaxError;
Kinvey.JSONParseError = JSONParseError;
Kinvey.KinveyError = KinveyError;
Kinvey.KinveyInternalErrorRetry = KinveyInternalErrorRetry;
Kinvey.KinveyInternalErrorStop = KinveyInternalErrorStop;
Kinvey.MissingQueryError = MissingQueryError;
Kinvey.MissingRequestHeaderError = MissingRequestHeaderError;
Kinvey.MissingRequestParameterError = MissingRequestParameterError;
Kinvey.MobileIdentityConnectError = MobileIdentityConnectError;
Kinvey.NoActiveUserError = NoActiveUserError;
Kinvey.NetworkConnectionError = NetworkConnectionError;
Kinvey.NoResponseError = NoResponseError;
Kinvey.NotFoundError = NotFoundError;
Kinvey.ParameterValueOutOfRangeError = ParameterValueOutOfRangeError;
Kinvey.PopupError = PopupError;
Kinvey.QueryError = QueryError;
Kinvey.ServerError = ServerError;
Kinvey.StaleRequestError = StaleRequestError;
Kinvey.SyncError = SyncError;
Kinvey.TimeoutError = TimeoutError;
Kinvey.UserAlreadyExistsError = UserAlreadyExistsError;
Kinvey.WritesToCollectionDisallowedError = WritesToCollectionDisallowedError;

// Add Racks
Kinvey.CacheRack = CacheRack;
Kinvey.NetworkRack = NetworkRack;
Kinvey.Rack = Rack;

// Export
module.exports = Kinvey;
