import * as bghttp from 'nativescript-background-http';
import { File } from 'tns-core-modules/file-system';
import { KinveyError } from '../../core/errors';
import { KinveyResponse } from '../../core/request';
import { CommonFileStore, FileMetadata, FileUploadRequestOptions } from './common';

export class FileStore extends CommonFileStore {
  private makeUploadRequest(url: string, file: File, metadata: FileMetadata, options: FileUploadRequestOptions);
  private makeUploadRequest(url: string, filePath: string, metadata: FileMetadata, options: FileUploadRequestOptions);
  private makeUploadRequest(url: string, file: string | File, metadata: FileMetadata, options: FileUploadRequestOptions) {
    return new Promise((resolve, reject) => {
      const filePath = file instanceof File ? file.path : file;
      const session = bghttp.session('file-upload');
      const request = {
        url,
        method: 'POST',
        headers: Object.assign({}, options.headers, {
          'Content-Type': metadata.mimeType
        }),
        description: 'Kinvey File Upload'
      };
      const task = session.uploadFile(filePath, request);

      task.on('error', (e) => {
        reject(e.error);
      });

      task.on('cancelled', (e) => {
        reject(new KinveyError(`File upload for ${filePath} has been cancelled.`));
      });

      task.on('complete', () => {
        resolve(new KinveyResponse({ statusCode: 200, headers: {}, data: '' }));
      });
    });
  }
}
