const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              //  Modified variables go here. For instance, to set the theme color:
              // '@primary-color': '#1DA57A'
              '@primary-color': '#0096e0',
              '@link-color': '#0096e0',
              '@success-color': '#05cc2a',
              '@warning-color': '#ef8f1a',
              '@error-color': '#dc0e5a',
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
