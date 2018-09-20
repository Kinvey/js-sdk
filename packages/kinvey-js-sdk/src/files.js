import isNumber from 'lodash';
import {
  execute,
  formatKinveyBaasUrl,
  Request,
  KinveyRequest,
  RequestMethod,
  Auth
} from './http';
import Query from './query';

const NAMESPACE = 'blob';

export async function downloadByUrl(url) {
  const request = new Request({
    method: RequestMethod.GET,
    url
  });
  const response = await execute(request);
  return response.data;
}

export async function find(query = new Query(), options = {}) {
  if (query && !(query instanceof Query)) {
    throw new Error('Invalid query. It must be an instance of the Query class.');
  }

  const { download = false, tls = true, ttl } = options;
  const queryStringObject = Object.assign({}, query.toQueryObject(), { tls: tls === true });

  if (isNumber(ttl)) {
    queryStringObject.ttl_in_seconds = parseInt(ttl, 10);
  }

  const request = new KinveyRequest({
    method: RequestMethod.GET,
    auth: Auth.Default,
    url: formatKinveyBaasUrl(`/${NAMESPACE}/appKey`, queryStringObject)
  });
  const response = await execute(request);
  const files = response.data;

  if (download === true) {
    return Promise.all(files.map(file => downloadByUrl(file._downloadURL, options)));
  }

  return files;
}

export async function download(id) {

}

export async function findById(id, options) {
  return download(id, options);
}

export async function stream(id, options = {}) {
  return download(id, Object.assign(options, { stream: true }));
}

function transformMetadata(file = {}, metadata = {}) {
  const fileMetadata = Object.assign({
    filename: file._filename || file.name,
    public: false,
    size: file.size || file.length,
    mimeType: file.mimeType || file.type || 'application/octet-stream'
  }, metadata);
  fileMetadata._filename = metadata.filename;
  delete fileMetadata.filename;
  fileMetadata._public = metadata.public;
  delete fileMetadata.public;
  return fileMetadata;
}

async function saveFileMetadata(metadata, options = {}) {
  if (metadata.size <= 0) {
    throw new Error('Unable to create a file with a size of 0.');
  }
}

export async function upload(file = {}, metadata = {}, options = {}) {
  const fileMetadata = transformMetadata(file, metadata);
}

export async function create(file, metadata, options) {
  return upload(file, metadata, options);
}

export async function update(file, metadata, options) {
  return upload(file, metadata, options);
}

export async function remove() {
  throw new Error('Please use removeById() to remove files one by one.');
}

export async function removeById(id, options = {}) {
  const request = new KinveyRequest({
    method: RequestMethod.DELETE,
    auth: Auth.Default,
    url: formatKinveyBaasUrl(`/${NAMESPACE}/appKey/${id}`)
  });
  const response = await execute(request);
  return response.data;
}
