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
    devServerConfig.client = false;
    devServerConfig.webSocketServer = false;
    devServerConfig.hot = false;
    devServerConfig.liveReload = false;
    devServerConfig.headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
    };
    return devServerConfig;
  },
};
