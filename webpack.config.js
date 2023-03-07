const dotenv = require("dotenv");
const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

const env = dotenv.config().parsed;

module.exports = {
  entry: "./src/index.tsx",
  mode: "development",
  output: {
    filename: "index.js",
    path: path.join(__dirname, "./dist"),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpe?g|svg|gif)$/,
        use: "file-loader",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  cache: true,
  devServer: {
    static: {
      directory: path.join(__dirname, "./dist"),
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": JSON.stringify(env),
    }),
    new CopyPlugin({
      patterns: [{ from: "public" }],
    }),
  ],
};
