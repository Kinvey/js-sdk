import { Aggregation } from '../src/aggregation';
import { randomString } from '../src/utils/string';
import { isDefined } from '../src/utils/object';

const commonTitle = 'Kinvey';

describe('Aggregation', () => {
  let entities = [];

  beforeEach(() => {
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
  });

  afterEach(() => {
    entities = [];
  });

  describe('count()', () => {
    test('should return the count of a unique property value for all entities', () => {
      const aggregation = Aggregation.count('title');
      const results = aggregation.process(entities);
      results.forEach((result) => {
        if (result.title === commonTitle) {
          expect(result.count).toEqual(26);
        } else {
          expect(result.count).toEqual(1);
        }
      });
    });
  });

  describe('sum()', () => {
    test('should return the quantity sum', () => {
      let sum = 0;
      entities.forEach(entity => {
        sum += entity.quantity;
      });

      const aggregation = Aggregation.sum('quantity');
      const result = aggregation.process(entities);
      expect(result.sum).toEqual(sum);
    });
  });

  describe('min()', () => {
    test('should return the minimum quanity', () => {
      let min = Infinity;
      entities.forEach(entity => {
        min = Math.min(min, entity.quantity);
      });

      const aggregation = Aggregation.min('quantity');
      const result = aggregation.process(entities);
      expect(result.min).toEqual(min);
    });
  });

  describe('max()', () => {
    it('should return the maximum quanity', () => {
      let max = -Infinity;
      entities.forEach(entity => {
        max = Math.max(max, entity.quantity);
      });

      const aggregation = Aggregation.max('quantity');
      const result = aggregation.process(entities);
      expect(result.max).toEqual(max);
    });
  });

  describe('average()', () => {
    it('should return the quanity average', () => {
      let average = 0;
      let count = 0;
      entities.forEach(entity => {
        average = (average * count + entity.quantity) / (count + 1);
        count += 1;
      });

      const aggregation = Aggregation.average('quantity');
      const result = aggregation.process(entities);
      expect(result.average).toEqual(average);
      expect(result.count).toEqual(count);
    });
  });
});