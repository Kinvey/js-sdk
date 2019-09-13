import { Aggregation } from '../aggregation';

const docs = [
  {
    _id: 1,
    age: 1,
  },
  {
    _id: 2,
    age: 10,
  },
];

describe('Aggregation', () => {});

describe('average', () => {
  it('should return the average for the data set', () => {
    const { count, average } = docs.reduce(
      (result, doc) => {
        return { average: (result.average * result.count + doc.age) / (result.count + 1), count: result.count + 1 };
      },
      { count: 0, average: 0 }
    );
    const aggregation = Aggregation.average('age');
    const result = aggregation.process(docs);
    expect(result).toEqual({ count, average });
  });
});
