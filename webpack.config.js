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
      'react-native-maps': 'react-native-web-maps',
      'react-native-reanimated': 'react-native-reanimated/lib/module/web',
      '@react-native': '@react-native-web',
      'react-native-svg': 'react-native-svg-web',
      'react-native-vector-icons': 'react-native-vector-icons/dist/web',
    },
    extensions: ['.web.js', '.web.tsx', '.web.ts', '.web.jsx', '.js', '.jsx', '.ts', '.tsx'],
    fallback: {
      crypto: false,
      stream: false,
      path: false,
      fs: false
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules\/(?!(react-native|@react-native|react-native-.*|@react-navigation\/.*|@expo.*)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-env'],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-runtime',
              'react-native-web',
              process.env.NODE_ENV === 'production' ? 'transform-remove-console' : null
            ].filter(Boolean)
          }
        }
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        use: {
          loader: 'url-loader',
          options: {
            limit: 8192,
            name: 'static/media/[name].[hash:8].[ext]',
          },
        },
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'static/media/[name].[hash:8].[ext]',
          },
        },
      },
    ],
  },
  plugins: []
};
