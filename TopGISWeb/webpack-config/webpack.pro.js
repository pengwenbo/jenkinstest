const path = require("path")
const webpack = require("webpack")
const merge = require("webpack-merge")
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin")
const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpackCommon = require('./webpack.common.js')
const wconfig = require("./config")


const webpackProd = {
  mode: "production",
  optimization: {
    minimizer: [
      new UglifyJsPlugin({ //压缩js
        cache: true,
        parallel: true,
        sourceMap: false
      }),
      new OptimizeCSSAssetsPlugin() //压缩css
      ,
      new CleanWebpackPlugin(),
      /*   new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('production')
        }) */
    ]
  },
  /*  plugins: [
     new CopyWebpackPlugin([{
         from: path.resolve(__dirname, '../dynamic-modules'),
         to: path.resolve(__dirname, `../${wconfig.distpath}/dynamic-modules`),
         ignore: ['.*']
       },
       {
         from: path.resolve(__dirname, '../configs'),
         to: path.resolve(__dirname, `../${wconfig.distpath}/configs`),
         ignore: ['.*']
       },
       {
         from: path.resolve(__dirname, '../custom.js'),
         to: path.resolve(__dirname, `../${wconfig.distpath}/custom.js`),
         ignore: ['.*'],
         toType: "dir"
       },
       {
         from: path.resolve(__dirname, '../images'),
         to: path.resolve(__dirname, `../${wconfig.distpath}/images`),
         ignore: ['.*']
       },
       {
         from: path.resolve(__dirname, '../jimu.js'),
         to: path.resolve(__dirname, `../${wconfig.distpath}/jimu.js`),
         ignore: ['.*'],
         toType: "dir"
       },
       {
         from: path.resolve(__dirname, '../libs'),
         to: path.resolve(__dirname, `../${wconfig.distpath}/libs`),
         ignore: ['.*']
       },
       {
         from: path.resolve(__dirname, '../resource'),
         to: path.resolve(__dirname, `../${wconfig.distpath}/resource`),
         ignore: ['.*']
       },
       {
         from: path.resolve(__dirname, '../themes'),
         to: path.resolve(__dirname, `../${wconfig.distpath}/themes`),
         ignore: ['.*']
       },
       {
         from: path.resolve(__dirname, '../widgets'),
         to: path.resolve(__dirname, `../${wconfig.distpath}/widgets`),
         ignore: ['.*']
       },
       {
         from: path.resolve(__dirname, '../appinfo.json'),
         to: path.resolve(__dirname, `../${wconfig.distpath}/appinfo.json`),
         ignore: ['.*'],
         toType: "file"
       },

       {
         from: path.resolve(__dirname, '../packages.config'),
         to: path.resolve(__dirname, `../${wconfig.distpath}/packages.config`),
         ignore: ['.*'],
         toType: "file"
       }

     ])
   ] */
}

module.exports = merge(webpackCommon, webpackProd)