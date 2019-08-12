import isString from "lodash/isString";
import { openDatabase, Transaction } from "react-native-sqlite-storage";
import { KinveyError } from "kinvey-js-sdk/lib/errors/kinvey";

const MASTER_TABLE_NAME = "sqlite_master";

function execute(dbName: string, tableName: string, sqlQueries: any, write = false): Promise<any> {
  const escapedTableName = `"${tableName}"`;
  const isMaster = tableName === MASTER_TABLE_NAME;

  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDatabase({ name: dbName, location: "default" });
      db.transaction(
        (tx: Transaction) => {
          new Promise(resolve => {
            if (write && !isMaster) {
              tx.executeSql(
                `CREATE TABLE IF NOT EXISTS ${escapedTableName} (key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)`,
                [],
                () => resolve()
              );
            } else {
              resolve();
            }
          })
            .then(() => {
              return Promise.all(
                sqlQueries.map((query: any) => {
                  return new Promise(resolve => {
                    tx.executeSql(
                      query[0].replace("#{table}", escapedTableName),
                      query[1],
                      (_: any, resultSet: any) => {
                        const response = {
                          rowCount: resultSet.rows.length || resultSet.rowsAffected,
                          result: []
                        };

                        if (resultSet.rows.length > 0) {
                          for (let i = 0, len = resultSet.rows.length; i < len; i += 1) {
                            const { value } = resultSet.rows.item(i);

                            try {
                              const doc = isMaster ? value : JSON.parse(value);
                              (response.result as any).push(doc);
                            } catch (error) {
                              (response.result as any).push(value);
                            }
                          }
                        }

                        resolve(response);
                      }
                    );
                  });
                })
              );
            })
            .then((responses: any = []) => {
              return responses.reduce(
                ({ rowCount = 0, result = [] }, response: any) => {
                  return {
                    rowCount: rowCount + response.rowCount,
                    result: result.concat(response.result)
                  };
                },
                { rowCount: 0, result: [] }
              );
            })
            .then(resolve)
            .catch(reject);
        },
        (err: any) => {
          const errorMessage = isString(err) ? err : err.message;

          if (errorMessage && errorMessage.indexOf("no such table") === -1) {
            resolve({ rowCount: 0, result: [] });
          } else {
            const sql = "SELECT name AS value from #{table} WHERE type = ? AND name = ?";
            const parameters = ["table", tableName];
            execute(dbName, MASTER_TABLE_NAME, [[sql, parameters]])
              .then((response: any) => {
                if (response.result.length === 0) {
                  return resolve({ rowCount: 0, result: [] });
                }
                return reject(
                  new KinveyError(
                    `Unable to open a transaction for the ${tableName} collection on the ${dbName} SQLite database.`
                  )
                );
              })
              .catch(reject);
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

export async function find(dbName: string, tableName: string) {
  const response = await execute(dbName, tableName, [["SELECT value FROM #{table}"]]);
  return response.result;
}

export async function count(dbName: string, tableName: string) {
  const response = await execute(dbName, tableName, [
    ["SELECT COUNT(DISTINCT key) AS value FROM #{table}"]
  ]);
  return response.result.shift() || 0;
}

export async function findById(dbName: string, tableName: string, id: string) {
  const response = await execute(dbName, tableName, [
    ["SELECT value FROM #{table} WHERE key = ?", [id]]
  ]);
  return response.result.shift();
}

export async function save(dbName: string, tableName: string, docs: any = []) {
  const sqlQueries = docs.map((doc: any) => [
    "REPLACE INTO #{table} (key, value) VALUES (?, ?)",
    [doc._id, JSON.stringify(doc)]
  ]);
  await execute(dbName, tableName, sqlQueries, true);
  return docs;
}

export async function removeById(dbName: string, tableName: string, id: string) {
  const response = await execute(
    dbName,
    tableName,
    [["DELETE FROM #{table} WHERE key = ?", [id]]],
    true
  );
  return response.rowCount;
}

export async function clear(dbName: string, tableName: string) {
  await execute(dbName, tableName, [["DROP TABLE IF EXISTS #{table}"]], true);
  return true;
}

export async function clearDatabase(dbName: string, exclude: string[] = []) {
  const response = await execute(dbName, MASTER_TABLE_NAME, [
    ["SELECT name AS value FROM #{table} WHERE type = ?", ["table"]]
  ]);
  const tables = response.result;

  if (tables.length > 0) {
    await Promise.all(
      tables.map((tableName: string) => {
        if (exclude.indexOf(tableName) === -1) {
          return execute(dbName, tableName, [["DROP TABLE IF EXISTS #{table}"]], true);
        }

        return null;
      })
    );
  }

  return true;
}
