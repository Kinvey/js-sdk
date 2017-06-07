import { Promise } from 'es6-promise';
import { Observable } from 'rxjs/Observable';

export class KinveyObservable extends Observable {
  toPromise(): Promise<any> {
    return new Promise((resolve, reject) => {
      let value;
      this.subscribe((v) => {
        value = v;
      }, reject, () => {
        resolve(value);
      });
    });
  }

  static create(subscriber) {
    return new KinveyObservable(subscriber);
  }
}
