/**
 * ## backupDatabase.js
 * ### Create local backup of database specified under _pool_ key in env.json.
 *
 * Can be invoked directly with
 * ```
 *   node backupDatabase.js [location]
 * ```
 * Or from within the project via the npm script
 * ```
 *   npm run backup-database [location]
 * ```
 *
 * By default, the backup is written to a new file `/path/testdata_TIMESTAMP.sql`, where the value
 * of `/path/testdata.sql` is read from the _testDataPath_ key in env.json.
 *
 * The optional argument _loacation_ may be supplied to specify a different target path for the backup.
 */

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
  `mysqldump -R -u ${pool.user} -p ${pool.database}`,
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
