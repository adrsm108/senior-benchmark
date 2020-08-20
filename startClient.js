/*
* startClient.js
* Runs command `npm run start-app` in new shell, directing stdio to parent console.
* */
require('child_process').spawn('npm', ['run start-app'], {
  stdio: 'inherit',
  shell: true,
});