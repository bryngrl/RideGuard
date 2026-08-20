module.exports = function (api) {
  api.cache(true);

  // THIS WILL CACHE THE BABEL CONFIGURATION FOR FASTER REBUILDS
  // SO BABEL DOES NOT RE-RUN THE CONFIG FUNCTION EVERY TIME IT
  // TRANSFORM A FILE, THIS MAKES BUILDS/DEV SERVER STARTUP MORE EFFICIENT
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // MEANS IN PRODUCTION BUILDS, WE WILL REMOVE ALL CONSOLE LOGS FROM THE BUNDLE
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  };
};
