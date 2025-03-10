const path = require("path");

module.exports = {
  mode: "development",
  entry: "./firebaseConfigzzz.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  devtool: "eval-cheap-source-map",
  watch: true,
};