const path = require('path')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin');

//只需要使用npm run dll一次就行// 注意打包出来的 vendor 需要手动导入
module.exports = {
  mode: 'production',
  entry: {
    //这里第三方框架放入，例如Vue
    vendor: ['']
  },
  output: {
    filename: 'dll/_dll_[name].js',
    path: path.resolve(__dirname, 'webpack-list'),
    library: '_dll_[name]'
  },
  plugins: [
    new webpack.DllPlugin({
      name: '_dll_[name]',
      path: path.resolve(__dirname, 'webpack-list/dll', 'mainfist.json')
    }),
    // new CleanWebpackPlugin(['./webpack-list/dll']), //删除dll目录下的文件
  ]
}