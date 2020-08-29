const deploymentRepo =
  'https://github.com/adrsm108/senior-benchmark-deployed.git';

try {
  require('fs').rmdirSync('./node_modules/.cache/gh-pages', {recursive: true});
} catch (e) {
  console.error(e);
}

require('gh-pages').publish(
  '.',
  {
    src: [
      'build/**/*',
      'testdata/senior_benchmark_testdata_deployed.sql',
      'server.js',
      'resetDatabase.js',
      'backupDatabase.js',
      'env.example',
    ],
    remove: '!(package.json)',
    branch: 'master',
    repo: deploymentRepo,
    // history: false,
  },
  (err) => {
    console.error(err);
  }
);
