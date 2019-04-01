// module.exports = async ({ config }) => console.dir(config.plugins, { depth: null }) || config;
//
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
//
// module.exports = {
//     context: path.resolve(__dirname, '..'),
//
//     devtool: 'eval',
//
//     // entry: {
//     //     'stories': [
//     //         '../packages/navigation/src/index.js',
//     //         './src/index.js'
//     //     ]
//     // },
//
//     module: {
//         rules: [
//             {
//                 test: /\.(ts|tsx)$/,
//                 loaders: ['babel-loader', 'ts-loader']
//             },
//             {
//                 test: /\.scss$/,
//                 use: [
//                     'style-loader', //: MiniCssExtractPlugin.loader,
//                     {
//                         loader: 'css-loader',
//                         options: {
//                             importLoaders: 1
//                         }
//                     },{
//                         loader: 'postcss-loader',
//                         options: {
//                             sourceMap: 'inline'
//                         }
//                     },{
//                         loader: 'resolve-url-loader'
//                     },{
//                         loader: 'sass-loader',
//                         options: {
//                             sourceMap: true
//                         }
//                     }]
//             },
//         ]
//     },
//
//     resolve: {
//         extensions: [ '.jsx', '.js', '.tsx', '.ts' ]
//     }
// };


// module.exports = (baseConfig, env) => {
//     console.log("baseConfig", baseConfig);
//     baseConfig.module.rules.push({
//         test: /\.(ts|tsx)$/,
//         loaders: require.resolve("awesome-typescript-loader")
//     });
//     baseConfig.plugins.push(new TSDocgenPlugin());
//     baseConfig.resolve.extensions.push(".ts", ".tsx");
//     return baseConfig;
// };