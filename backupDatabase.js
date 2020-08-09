/*
* backupDatabase.js
*
* usage:
*   node backupDatabase.js [location]
* OR
*   npm run backup-database [location]
*
* Creates local backup of database specified under "pool" key of env.json.
*
* By default, backup is written to a new file at /test/data/path_TIMESTAMP.sql, where
* /test/data/path.sql is read from the "testDataPath" key of env.json.
* An additional argument may be used to specify a different target path.
* */

const fs = require('fs');
const path = require('path');
const {pool, testDataPath} = require('./env.json');
const backupFile = path.resolve(
  process.argv[2] || // backup file can be specified as an argument
    testDataPath.replace(
      // defaults to new timestamped file
      /(\.[^.]*)?$/i, // match file extension (potentially absent)
      `_${new Date().toISOString().replace(/[:.]/g, '_')}$1` // $1 expands to matched extension
    )
);
require('child_process').exec(
  `mysqldump -u ${pool.user} -p ${pool.database}`,
  (error, stdout, stderr) => {
    console.log(`Attempting to backup database ${pool.database}`);
    if (error) throw error;
    fs.writeFile(
      backupFile,
      stdout,
      {flag: process.argv[2] ? 'w+' : 'wx+'}, // don't overwrite existing files unless explicitly instructed
      (error) => {
        if (error) throw error;
        console.log('Backup written to');
        console.log(backupFile);
      }
    );
  }
);
