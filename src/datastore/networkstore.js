import Network from './network';

export default class NetworkStore {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  find(query, options) {
    const network = new Network(this.collectionName);
    return network.find(query, options);
  }

  count(query, options) {
    const network = new Network(this.collectionName);
    return network.count(query, options);
  }

  group(aggregation, options) {
    const network = new Network(this.collectionName);
    return network.group(aggregation, options);
  }

  findById(id, options) {
    const network = new Network(this.collectionName);
    return network.findById(id, options);
  }

  create(doc, options) {
    const network = new Network(this.collectionName);
    return network.create(doc, options);
  }

  update(doc, options) {
    const network = new Network(this.collectionName);
    return network.update(doc, options);
  }

  save(doc, options) {
    if (doc._id) {
      return this.update(doc, options);
    }

    return this.create(doc, options);
  }

  remove(query, options) {
    const network = new Network(this.collectionName);
    return network.remove(query, options);
  }

  removeById(id, options) {
    const network = new Network(this.collectionName);
    return network.removeById(id, options);
  }
}
