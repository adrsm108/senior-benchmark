/**
 * ## resetDatabase.js
 * ### Resets database specified in the _pool_ key of env.json from a local backup.
 *
 * Can be invoked directly as
 * ```
 *   node resetDatabase.js [source]
 * ```
 * Or from within the project via the npm script
 * ```
 *   npm run reset-database [source]
 * ```
 *
 * By default, the location of the data source is read from the _testDataPath_ key of env.json.
 *
 * The optional argument _source_ can be used to specify a different file.
 */

const {pool, testDataPath} = require('./env.json');
let [, , dataPath = testDataPath] = process.argv;

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
