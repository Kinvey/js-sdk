export function applyQueryToDataset(dataset, query) {
  if (!query) {
    return dataset;
  }
  return query.process(dataset);
}

export const collectionsMaster = 'master';