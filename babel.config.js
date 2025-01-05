module.exports = function(api) {
  api.cache(true);

  return {
    presets: [
      ['@babel/preset-env', {
        targets: {
          node: 'current',
          browsers: ['last 2 versions', 'ie >= 11']
        },
        modules: false,
        loose: true
      }],
      '@babel/preset-react',
      ['babel-preset-expo', { loose: true }]
    ],
    plugins: [
      ['@babel/plugin-transform-runtime', {
        helpers: true,
        regenerator: true
      }],
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }],
      'react-native-web',
      'react-native-reanimated/plugin'
    ],
    env: {
      production: {
        plugins: ['transform-remove-console']
      }
    }
  };
};
