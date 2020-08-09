/*
* resetDatabase.js
*
* usage:
*   node resetDatabase.js [source]
* OR
*   npm run reset-database [source]
*
* Resets the database given in "pool" of env.json from a local backup.
*
* By default, the location of the data source is read from the "testDataPath" key of env.json.
* An additional argument can be used to specify a different file.
* */

const {pool, testDataPath} = require('./env.json');
let [,,dataPath = testDataPath] = process.argv;

require('child_process').exec(
  `mysql -u ${pool.user} -p ${pool.database} < ${dataPath}`,
  (error, stdout, stderr) => {
    console.log(
      `Attempting to reset database ${pool.database} from file ${dataPath}`
    );
    if (error) throw error;

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('Done.');
  }
);
