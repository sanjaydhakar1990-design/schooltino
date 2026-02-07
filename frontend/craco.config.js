const path = require("path");

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/build/**',
          '**/dist/**',
          '**/coverage/**',
          '**/public/**',
        ],
      };
      return webpackConfig;
    },
  },
  devServer: (devServerConfig) => {
    devServerConfig.allowedHosts = 'all';
    devServerConfig.client = {
      webSocketURL: 'auto://0.0.0.0:0/ws',
    };
    return devServerConfig;
  },
};
