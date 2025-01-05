const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      'react-native-reanimated': 'react-native-reanimated/lib/commonjs',
      'react-native-screens': 'react-native-screens/lib/commonjs',
    },
    extensions: ['.web.js', '.js', '.jsx', '.ts', '.tsx'],
    fallback: {
      "crypto": false,
      "stream": false,
      "path": false,
      "fs": false
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules\/(?!(react-native|react-native-reanimated|react-native-screens|@react-native|react-native-safe-area-context)\/).*/,
        use: {
          loader: 'babel-loader'
          // Removed babel options from here - they're now managed entirely in babel.config.js
        },
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'assets/',
          },
        },
      },
    ],
  },
};