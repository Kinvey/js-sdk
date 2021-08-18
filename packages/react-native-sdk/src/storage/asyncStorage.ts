import AsyncStorage from '@react-native-async-storage/async-storage';

const SEPARATOR = ':';

function getKey(dbName: string, tableName: string, id: string) {
  return `${dbName}${SEPARATOR}${tableName}${SEPARATOR}${id}`;
}

async function getTableKeys(dbName: string, tableName: string) {
  const allKeys = await AsyncStorage.getAllKeys();
  return allKeys.filter(key => key.indexOf(`${dbName}${SEPARATOR}${tableName}${SEPARATOR}`) === 0);
}

export async function find(dbName: string, tableName: string) {
  const tableRecords = await AsyncStorage.multiGet(await getTableKeys(dbName, tableName));
  return tableRecords.map(([key, value]) => JSON.parse(value));
}

export async function count(dbName: string, tableName: string) {
  const tableKeys = await getTableKeys(dbName, tableName);
  return tableKeys.length;
}

export async function findById(dbName: string, tableName: string, id: string) {
  const doc = await AsyncStorage.getItem(getKey(dbName, tableName, id));
  return doc ? JSON.parse(doc) : undefined;
}

export async function save(dbName: string, tableName: string, docs: any = []) {
  const kvPairs = docs.map(doc => [getKey(dbName, tableName, doc._id), JSON.stringify(doc)]);
  await AsyncStorage.multiSet(kvPairs);
  return kvPairs;
}

export async function removeById(dbName: string, tableName: string, id: string) {
  const key = getKey(dbName, tableName, id);
  const doc = await AsyncStorage.getItem(key);
  if (doc) {
    await AsyncStorage.removeItem(key);
    return 1;
  }
  return 0;
}

export async function clear(dbName: string, tableName: string) {
  await AsyncStorage.multiRemove(await getTableKeys(dbName, tableName));
  return true;
}

export async function clearDatabase(dbName: string, exclude: string[] = []) {
  const allKeys = await AsyncStorage.getAllKeys();
  const keysToRemove = allKeys.filter(key => key.indexOf(`${dbName}${SEPARATOR}`) === 0 && !exclude.includes(key));
  await AsyncStorage.multiRemove(keysToRemove);
  return true;
}
