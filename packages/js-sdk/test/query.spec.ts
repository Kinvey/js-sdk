/// <reference types="mocha" />

import { expect } from 'chai';
import { Query } from '../src/query';
import { QueryError } from '../src/errors/query';

describe('Query', function () {
  describe('ascending()', function() {
    it('should throw an error if the field is not a string', function() {
      try {
        const query = new Query();
        // @ts-ignore
        query.ascending();
      } catch (error) {
        expect(error).to.be.instanceOf(QueryError);
        expect(error.message).to.equal('The provided field must be a string.')
      }
    });

    it('should sort the field ascending', function () {
      const field = 'field';
      const query = new Query();
      query.ascending(field);
      expect(query.sort[field]).to.equal(1);
    });
  });

  describe('descending()', function () {
    it('should throw an error if the field is not a string', function () {
      try {
        const query = new Query();
        // @ts-ignore
        query.descending();
      } catch (error) {
        expect(error).to.be.instanceOf(QueryError);
        expect(error.message).to.equal('The provided field must be a string.')
      }
    });

    it('should sort the field descending', function () {
      const field = 'field';
      const query = new Query();
      query.descending(field);
      expect(query.sort[field]).to.equal(-1);
    });
  });
});
