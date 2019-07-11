import { expect } from 'chai';
import { Kmd } from '../src/kmd';

describe('Kmd', function() {
  describe('createdAt', function() {
    it('should return undefined', function() {
      const kmd = new Kmd();
      expect(kmd.createdAt).to.be.undefined;
    });

    it('should return undefined', function() {
      const kmd = new Kmd({});
      expect(kmd.createdAt).to.be.undefined;
    });

    it('should return the value as a Date', function() {
      const ect = new Date().toISOString();
      const kmd = new Kmd({ ect });
      expect(kmd.createdAt).to.deep.equal(new Date(ect));
    });
  });

  describe('updatedAt', function() {
    it('should return undefined', function() {
      const kmd = new Kmd();
      expect(kmd.updatedAt).to.be.undefined;
    });

    it('should return undefined', function() {
      const kmd = new Kmd({});
      expect(kmd.updatedAt).to.be.undefined;
    });

    it('should return the value as a Date', function() {
      const lmt = new Date().toISOString();
      const kmd = new Kmd({ lmt });
      expect(kmd.updatedAt).to.deep.equal(new Date(lmt));
    });
  });

  describe('authtoken', function() {
    it('should return undefined', function() {
      const kmd = new Kmd();
      expect(kmd.authtoken).to.be.undefined;
    });

    it('should return undefined', function() {
      const kmd = new Kmd({});
      expect(kmd.authtoken).to.be.undefined;
    });

    it('should return the value', function() {
      const authtoken = 'authtoken';
      const kmd = new Kmd({ authtoken });
      expect(kmd.authtoken).to.equal(authtoken);
    });
  });

  describe('isEmailConfirmed()', function() {
    it('should return false', function() {
      const kmd = new Kmd();
      expect(kmd.isEmailConfirmed()).to.be.false;
    });

    it('should return false', function() {
      const kmd = new Kmd({
        emailVerification: {
          status: 'unconfirmed'
        }
      });
      expect(kmd.isEmailConfirmed()).to.be.false;
    });

    it('should return true', function() {
      const kmd = new Kmd({
        emailVerification: {
          status: 'confirmed'
        }
      });
      expect(kmd.isEmailConfirmed()).to.be.true;
    });
  });

  describe('isLocal()', function() {
    it('should return false', function() {
      const kmd = new Kmd();
      expect(kmd.isLocal()).to.be.false;
    });

    it('should return false', function() {
      const kmd = new Kmd({ local: false });
      expect(kmd.isLocal()).to.be.false;
    });

    it('should return true', function() {
      const kmd = new Kmd({ local: true });
      expect(kmd.isLocal()).to.be.true;
    });
  });
});
