import { expect } from 'chai';
import { Query } from '../src/query';
import { QueryError } from '../src/errors/query';

describe('Query', function () {
  describe('notEqualTo()', function () {
    it('should throw an error if the field is not a string', function () {
      try {
        const query = new Query();
        // @ts-ignore
        query.notEqualTo();
      } catch (error) {
        expect(error).to.be.instanceOf(QueryError);
        expect(error.message).to.equal('The field argument must be a string.');
      }
    });

    it('should add the $neq filter', function () {
      const field = 'field';
      const value = 'foo'
      const query = new Query();
      query.notEqualTo(field, value);
      expect(query.filter[field]).to.deep.equal({ $ne: value });
    });

    it('should add the $neq filter if value is null', function () {
      const field = 'field';
      const query = new Query();
      query.notEqualTo(field, null);
      expect(query.filter[field]).to.deep.equal({ $ne: null });
    });
  });

  describe('notContainedIn()', function() {
    it('should throw an error that a value must be provided', function () {
      try {
        const query = new Query();
        // @ts-ignore
        query.notContainedIn();
      } catch (error) {
        expect(error).to.be.instanceOf(QueryError);
        expect(error.message).to.equal('You must supply a value.');
      }
    });

    it('should throw an error if the field is not a string', function () {
      try {
        const query = new Query();
        // @ts-ignore
        query.notContainedIn(null, ['foo']);
      } catch (error) {
        expect(error).to.be.instanceOf(QueryError);
        expect(error.message).to.equal('The field argument must be a string.');
      }
    });

    it('should add the $nin filter', function () {
      const field = 'field';
      const values = ['foo'];
      const query = new Query();
      query.notContainedIn(field, values);
      expect(query.filter[field]).to.deep.equal({ $nin: values });
    });

    it('should add the $nin filter if values is not an array', function () {
      const field = 'field';
      const value = 'foo';
      const query = new Query();
      query.notContainedIn(field, value);
      expect(query.filter[field]).to.deep.equal({ $nin: [value] });
    });
  });

  describe('exists()', function() {
    it('should throw an error if the field is not a string', function () {
      try {
        const query = new Query();
        // @ts-ignore
        query.exists();
      } catch (error) {
        expect(error).to.be.instanceOf(QueryError);
        expect(error.message).to.equal('The field argument must be a string.');
      }
    });

    it('should add the $exists filter to true by default', function () {
      const field = 'field';
      const query = new Query();
      query.exists(field);
      expect(query.filter[field]).to.deep.equal({ $exists: true });
    });

    it('should add the $exists filter to true', function () {
      const field = 'field';
      const query = new Query();
      query.exists(field, true);
      expect(query.filter[field]).to.deep.equal({ $exists: true });
    });

    it('should add the $exists filter to false', function () {
      const field = 'field';
      const query = new Query();
      query.exists(field, false);
      expect(query.filter[field]).to.deep.equal({ $exists: false });
    });
  });

  describe('ascending()', function() {
    it('should throw an error if the field is not a string', function() {
      try {
        const query = new Query();
        // @ts-ignore
        query.ascending();
      } catch (error) {
        expect(error).to.be.instanceOf(QueryError);
        expect(error.message).to.equal('The provided field must be a string.');
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
        expect(error.message).to.equal('The provided field must be a string.');
      }
    });

    it('should sort the field descending', function () {
      const field = 'field';
      const query = new Query();
      query.descending(field);
      expect(query.sort[field]).to.equal(-1);
    });
  });

  describe('or()', function() {
    it('should throw an error if the argument is null', function() {
      try {
        const query = new Query();
        query.or(null);
      } catch (error) {
        expect(error).to.be.instanceOf(QueryError);
        expect(error.message).to.equal('query argument must be of type: Kinvey.Query[] or Object[].');
      }
    });
  });

  describe('nor()', function () {
    it('should throw an error if the argument is null', function () {
      try {
        const query = new Query();
        query.nor(null);
      } catch (error) {
        expect(error).to.be.instanceOf(QueryError);
        expect(error.message).to.equal('query argument must be of type: Kinvey.Query[] or Object[].');
      }
    });
  });

  describe('and()', function () {
    it('should throw an error if the argument is null', function () {
      try {
        const query = new Query();
        query.and(null);
      } catch (error) {
        expect(error).to.be.instanceOf(QueryError);
        expect(error.message).to.equal('query argument must be of type: Kinvey.Query[] or Object[].');
      }
    });
  });
});
