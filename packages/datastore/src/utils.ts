import { Observable } from 'rxjs';

export class DataStorePromise<T> extends Promise<T> {
  toObservable(): Observable<T> {
    const stream = new Observable<T>((observer): void => {
      this.then((value) => {
        observer.next(value);
        observer.complete();
      });

      this.catch((reason) => {
        observer.error(reason);
        observer.complete();
      });
    });
    return stream;
  }
}

export class DataStoreObservable<T> extends Observable<T> {
  toPromise(): Promise<T> {
    return new Promise<T>((resolve, reject): void => {
      let value: T;
      this.subscribe(
        (v) => {
          value = v;
        },
        reject,
        () => {
          resolve(value);
        }
      );
    });
  }
}
