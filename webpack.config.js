const path = require('path');

module.exports = {
  mode: 'development',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  devtool: 'eval-cheap-source-map',
  watch: true,
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      // Add aliases for commonly used react-native libraries
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
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
              'module:metro-react-native-babel-preset'
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-runtime',
              'react-native-reanimated/plugin'
            ]
          },
        },
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
        use: 'file-loader',
      },
    ],
  },
};