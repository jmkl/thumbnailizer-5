const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
  entry:"./src/main.ts",
  mode:"production",
  module:{
    rules:[
      {
        test:/\.tsx?$/,
        use:'ts-loader',
        exclude:/node_modules/,
      }
    ]
  },
  resolve:{
    extensions:['.tsx','.ts','.js']
  },
  externals:{
    photoshop:'commonjs2 photoshop',
    uxp:'commonjs2 uxp',
    os:'commonjs2 os',
    path:'commonjs2 path',
  },
  output:{
    filename:"index.js",
    path:path.resolve(__dirname,'dist')
  },
  plugins:[
    new CopyPlugin({
      patterns:['plugin']
    })
  ]
}
