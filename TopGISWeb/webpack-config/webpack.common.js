const path = require("path")
const webpack = require("webpack")
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const wconfig = require("./config") //生成entry和html-webpack-plugin
let isDev = process.env.NODE_ENV !== "production" ? true : false //环境判断
let mypath = "static" //静态图片
let publicpath = isDev ? "/" : "./" //根据环境判断发布位置

function resolve(dir) {
  return path.join(__dirname, '..', dir)
} //设定路径别名时用

module.exports = {
  entry: wconfig.getentry(), //通过config.js生成
  output: {
    filename: 'dist/js/[name].build.js',
    chunkFilename: 'dist/js/[name].[chunkhash:8].js', //按需加载的js(常用：import())
    path: path.resolve(__dirname, '../webpack-dist'),
    publicPath: publicpath // './webpack-dist/'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.scss', '.json', '.css'],
    alias: {
      "src": resolve("webpack-src"),
      "module": resolve("nokia-modules"),
      'vue$': 'vue/dist/vue.esm.js'
    }
  },
  externals: {
    jquery: 'jQuery'
  },
  module: {
    rules: [{
        test: /\.css$/,
        use: wconfig.cssloader('css', isDev)
      },
      {
        test: /\.less$/,
        use: wconfig.cssloader('less', isDev)
      },
      {
        test: /\.styl$/,
        use: wconfig.cssloader('stylus', isDev)
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [{
          loader: "url-loader",
          options: {
            limit: 100,
            name: "[name].[hash:7].[ext]",
            outputPath: mypath
          }
        }]
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
        }
      },
      {
        test: /\.js$/,
        use: ["babel-loader"],
        exclude: "/node_modules/"
      },
      {
        test: /\.vue$/,
        use: ['vue-loader']
      }
    ]
  },
  optimization: {
    minimize: !isDev, // 开发环境不压缩
    splitChunks: {
      chunks: "all", // 共有三个值可选：initial(初始模块)、async(按需加载模块)和all(全部模块)
      minSize: 30000, // 模块超过30k自动被抽离成公共模块
      minChunks: 1, // 模块被引用>=1次，便分割
      maxAsyncRequests: 5, // 异步加载chunk的并发请求数量<=5
      maxInitialRequests: 3, // 一个入口并发加载的chunk数量<=3
      name: true, // 默认由模块名+hash命名，名称相同时多个模块将合并为1个，可以设置为function
      automaticNameDelimiter: '~', // 命名分隔符
      cacheGroups: { // 缓存组，会继承和覆盖splitChunks的配置
        default: { // 模块缓存规则，设置为false，默认缓存组将禁用
          minChunks: 2, // 模块被引用>=2次，拆分至vendors公共模块
          priority: -20, // 优先级
          reuseExistingChunk: true, // 默认使用已有的模块
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/, // 表示默认拆分node_modules中的模块
          name: "vendor",
          priority: -10
        },
        /*  styles: {
           name: 'styles',
           minSize: 30000,
           test: /\.css$/,
           chunks: 'all',
           enforce: true,
         } */
      }
    }
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "dist/css/[name].css",
      chunkFilename: "dist/css/[name].[chunkhash:8].css"
    }),
    /*  new webpack.DllReferencePlugin({
       manifest: path.resolve(__dirname, 'webpack-list/dll', 'mainfist.json')
     }), */
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    }),
    new VueLoaderPlugin()
    // new BundleAnalyzerPlugin()
  ]
}
wconfig.gethtmlplugin(isDev, module.exports.plugins)