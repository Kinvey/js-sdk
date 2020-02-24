import { expect } from 'chai';
import { getBaasProtocol, getAuthProtocol } from '../src/kinvey';

describe('Kinvey SDK Config', function () {
  it('should have baas protocol set to https: by default', function() {
    expect(getBaasProtocol()).to.equal('https:');
  });

  it('should have auth protocol set to https: by default', function () {
    expect(getAuthProtocol()).to.equal('https:');
  });
});
