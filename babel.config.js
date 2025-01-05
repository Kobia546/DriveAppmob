module.exports = function(api) {
  api.cache(true);
  
  const loose = true;
  
  return {
    presets: [
      ['@babel/preset-env', { loose }],
      '@babel/preset-react',
      ['babel-preset-expo', { loose }]
    ],
    plugins: [
      // Class features plugins with consistent loose mode
      ['@babel/plugin-transform-class-properties', { loose }],
      ['@babel/plugin-transform-private-methods', { loose }],
      ['@babel/plugin-transform-private-property-in-object', { loose }],
      
      // Additional necessary plugins
      '@babel/plugin-transform-runtime',
      ["module:react-native-dotenv", {
        moduleName: "@env",
        path: ".env",
      }],
      'react-native-reanimated/plugin' // Keep this last
    ]
  };
};