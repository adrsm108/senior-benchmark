const deploymentRepo =
  'https://github.com/adrsm108/senior-benchmark-deployed.git';

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
    history: false,
  },
  (err) => {
    console.error(err);
  }
);

