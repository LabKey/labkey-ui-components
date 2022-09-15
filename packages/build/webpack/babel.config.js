// Note: this babel config is NOT for our builds, it is for our tests. We need this because we export our packages as
// ES Modules, which are not natively supported by jest or node at the moment (they are technically supported but only
// experimentally). To get jest tests working you'll need to add the following to your package.json files:
//     "transform": {
//       "^.+\\.tsx?$": "ts-jest",
//       "\\.jsx?$": [
//         "babel-jest",
//         {
//           "configFile": "./node_modules/@labkey/build/webpack/babel.config.js"
//         }
//       ]
//     },
//     "transformIgnorePatterns": [
//       "node_modules/(?!(@labkey))"
//     ],
module.exports = {
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
