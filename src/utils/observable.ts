import { Promise } from 'es6-promise';
import { Observable } from 'rxjs/Observable';

export class KinveyObservable<T> extends Observable<T> {
  toPromise(): Promise<T> {
    return new Promise((resolve, reject) => {
      let value;
      this.subscribe((v) => {
        value = v;
      }, reject, () => {
        resolve(value);
      });
    });
  }

  static create<T>(subscriber): KinveyObservable<T> {
    return new KinveyObservable<T>(subscriber);
  }
}
