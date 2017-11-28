import { Operation } from './operation';

function getOperationWithData(type, collection, data) {
  return new Operation(type, collection, null, data);
}

export const operationFactory = {
  getOperationWithData
};
