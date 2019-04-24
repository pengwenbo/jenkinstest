const path = require("path")
const webpack = require("webpack")
const merge = require("webpack-merge")
const webpackCommon = require('./webpack.common.js')

const webpackDev = {
  mode: "development",
  devServer: {
    contentBase: path.join(__dirname, "../"),
    publicPath: '/',
    host: "localhost",
    port: "8010",
    inline: true,
    overlay: true, // 浏览器页面上显示错误
    hot: true, // 开启热更新
    //服务器代理配置项
    proxy: {
      '/Nokia_TopGis_Api': {
        target: 'http://221.182.241.179:85/Nokia_TopGis_Api',
        changeOrigin: true,
        pathRewrite: {
          '^/Nokia_TopGis_Api': ''
        }
      },
      '/arcgis': {
        target: 'http://221.182.241.179:85/arcgis',
        changeOrigin: true,
        pathRewrite: {
          '^/arcgis': ''
        }
      },
      '/barcgis_digitalmap': {
        target: 'http://221.182.241.179:85/arcgis_digitalmap',
        changeOrigin: true,
        pathRewrite: {
          '^/barcgis_digitalmap': ''
        }
      },
      '/TEST_API': {
        target: 'http://localhost:12237',
        changeOrigin: true,
        pathRewrite: {
          '^/TEST_API': ''
        }
      },
      '/gissearch': {
        target: 'http://221.182.241.179:85/gissearch',
        changeOrigin: true,
        pathRewrite: {
          '^/gissearch': ''
        }
      },
      '/dp_common_webapi': {
        target: 'http://221.182.241.179:85/dp_common_webapi',
        changeOrigin: true,
        pathRewrite: {
          '^/dp_common_webapi': ''
        }
      }
    }
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
}
module.exports = merge(webpackCommon, webpackDev);