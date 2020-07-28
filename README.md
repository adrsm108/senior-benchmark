This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Getting started
After creating a local copy of this repo with a 
```bash
$ git clone [url]
```
cd into the package directory and run
```bash
$ npm install
```
to install modules and dependencies. 
Afterwards, you can use the commands below to start developing.

## Available Scripts

### start

To run the app in development mode, you can run 
```bash 
$ npm start
```
from the project root directory. \
Open [http://localhost:3000](http://localhost:3000) to view it in the browser. \
It's pretty nice, you get automatic refreshing with every edit, and you can inspect lint errors in the console.

### start-server
```bash 
$ npm start-server
```
Runs the command `nodemon src/server.js`, which behaves like `node src/server.js`, but with the advantage of automatically 
restarting the server when changes are written to the source file. \
The server listens at [http://localhost:8080](http://localhost:8080), but even when the app is running in development 
mode on port 3000, api calls should work as normal, due to the proxy setup described [here](https://dev.to/loujaybee/using-create-react-app-with-express).

### test
_(I haven't really used this feature before.)_
```bash 
$ npm test
```
launches the test runner in the interactive watch mode.
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### build
```bash 
$ npm build
```

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### eject
```bash 
$ npm eject
```

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**
_(I doubt we'll ever want to)_

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `yarn build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
