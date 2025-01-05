const path = require("path");

module.exports = {
  mode: "development",
  entry: "./index.js", // Your entry point
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js", // Output bundle
  },
  devtool: "eval-cheap-source-map", // Source map for easier debugging
  watch: true, // Watch files for changes
  resolve: {
    alias: {
      // Alias for React Native specific modules, you may need react-native-web
      'react-native$': 'react-native-web', 
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'], // Handle different file extensions
  },
  module: {
    rules: [
      // JS and JSX loader
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      // TypeScript loader (if you are using TypeScript)
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      // Handle assets like images, fonts, etc. (optional, if needed)
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
        use: 'file-loader',
      },
    ],
  },
};
