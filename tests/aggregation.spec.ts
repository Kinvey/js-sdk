import expect = require('expect');
import { Aggregation } from '../src/aggregation';
import { randomString } from '../src/utils/string';
import { isDefined } from '../src/utils/object';

const commonTitle = 'Kinvey';

describe('Aggregation', () => {
  beforeEach(function() {
    const entities = [];

    function createEntity(title?: string) {
      return {
        _id: randomString(),
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        },
        title: isDefined(title) ? title : randomString(),
        quantity: Math.floor(Math.random() * (100 - 1)) + 1
      };
    }

    for (let i = 50; i >= 0; i -= 1) {
      if (i % 2 === 0) {
        entities.push(createEntity(commonTitle));
      } else {
        entities.push(createEntity());
      }
    }

    this.entities = entities;
  });

  afterEach(function() {
    delete this.entities;
  });

  describe('count()', function() {
    it('should return the count of a unique property value for all entities', function() {
      const aggregation = Aggregation.count('title');
      const results = aggregation.process(this.entities);
      expect(results).toBeA(Array);
      results.forEach((result) => {
        if (result.title === commonTitle) {
          expect(result.count).toEqual(26);
        } else {
          expect(result.count).toEqual(1);
        }
      });
    });
  });

  describe('sum()', function() {
    it('should return the quantity sum', function() {
      let sum = 0;
      this.entities.forEach(entity => {
        sum += entity.quantity;
      });

      const aggregation = Aggregation.sum('quantity');
      const result = aggregation.process(this.entities);
      expect(result.sum).toEqual(sum);
    });
  });

  describe('min()', function() {
    it('should return the minimum quanity', function() {
      let min = Infinity;
      this.entities.forEach(entity => {
        min = Math.min(min, entity.quantity);
      });

      const aggregation = Aggregation.min('quantity');
      const result = aggregation.process(this.entities);
      expect(result.min).toEqual(min);
    });
  });

  describe('max()', function() {
    it('should return the maximum quanity', function() {
      let max = -Infinity;
      this.entities.forEach(entity => {
        max = Math.max(max, entity.quantity);
      });

      const aggregation = Aggregation.max('quantity');
      const result = aggregation.process(this.entities);
      expect(result.max).toEqual(max);
    });
  });

  describe('average()', function() {
    it('should return the quanity average', function() {
      let average = 0;
      let count = 0;
      this.entities.forEach(entity => {
        average = (average * count + entity.quantity) / (count + 1);
        count += 1;
      });

      const aggregation = Aggregation.average('quantity');
      const result = aggregation.process(this.entities);
      expect(result.average).toEqual(average);
      expect(result.count).toEqual(count);
    });
  });
});