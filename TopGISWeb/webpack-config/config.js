const htmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
let wconfig = {}
wconfig.distpath = "webpack-dist"
let entry = [{
  name: "index",
  path: "module/index.js",
  title: "企业GIS",
  template: "index_main.html"
}]

let getHtmlConfig = function (name, title, isdev, template) {

  let path = isdev ? "" : `../${wconfig.distpath}/`
  return {
    template: `./webpack-src/htmltemplate/${template}`,
    filename: `${path}${name}.html`,
    title: title,
    chunks: [name, "vendor"] // 按需引入打包后的js文件
  }
}

wconfig.getentry = function () {
  let back = {}
  for (let arr of entry) {
    back[arr.name] = arr.path
  }
  return back
}

wconfig.gethtmlplugin = function (isdev, plugin) {
  for (let arr of entry) {
    plugin.push(new htmlWebpackPlugin(getHtmlConfig(arr.name, arr.title, isdev, arr.template)));
  }
}
wconfig.cssloader = function (type, isDev) {
  let userArray = [...(isDev ? ["css-hot-loader", "style-loader"] : [{
      loader: MiniCssExtractPlugin.loader,
      options: {
        publicPath: '../'
      }
    }]),
    'css-loader',
    {
      loader: 'postcss-loader',
      options: {
        plugins: [require("autoprefixer")],
        sourceMap: false
      }
    }
  ]
  if (type !== 'css') {
    userArray.push(`${type}-loader`)
  }
  return userArray

}
module.exports = wconfig