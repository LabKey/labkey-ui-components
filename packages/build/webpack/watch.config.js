/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const lkModule = process.env.LK_MODULE;
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const constants = require('./constants');
const path = require('path');

// relative to the <lk_module>/node_modules/@labkey/build/webpack dir
const entryPoints = require('../../../../src/client/entryPoints');

// set based on the lk module calling this config
__dirname = lkModule;

const devServer = {
    host: 'localhost',
    port: constants.watchPort,
    // enable the HMR on the server
    hot: true,
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    },
    compress: true,
    overlay: true,
    watchOptions: {
        // Ignore any packages folders, if we don't ignore packages then we will incorrectly trigger builds in
        // package folders (e.g. changing a file in the SM Workflow package would incorrectly trigger a build in SM)
        ignored: process.env.LINK ? [] : ['**/packages']
    }
};

const devServerURL = 'http://' + devServer.host + ':' + devServer.port;

let entries = {};
for (let i = 0; i < entryPoints.apps.length; i++) {
    const entryPoint = entryPoints.apps[i];

    entries[entryPoint.name] = [
        // activate HMR for React
        'react-hot-loader/patch',

        // bundle the client for webpack-dev-server
        // and connect to the provided endpoint
        'webpack-dev-server/client?' + devServerURL,

        'webpack/hot/only-dev-server',

        entryPoint.path + '/dev.tsx'
    ];
}

module.exports = {
    context: constants.context(__dirname),

    mode: 'development',

    devServer: devServer,

    entry: entries,

    output: {
        path: constants.outputPath(__dirname),
        publicPath: devServerURL + '/',
        filename: "[name].js"
    },

    resolve: {
        alias: {
            // Note that for modules that don't have these packages, the aliases are just ignored and don't
            // seem to cause any problems.
            '@labkey/components': constants.labkeyUIComponentsPath,
            '@labkey/freezermanager': constants.freezerManagerPath,
            '@labkey/workflow': constants.workflowPath,

            // This assures there is only one copy of react and react-dom in the application
            react: path.resolve(__dirname, "../node_modules/react"),
            'react-dom': require.resolve('@hot-loader/react-dom'),
        },

        extensions: constants.extensions.TYPESCRIPT.concat('.scss')
    },

    module: {
        rules: constants.loaders.TYPESCRIPT_DEV.concat(constants.loaders.STYLE_DEV).concat(constants.loaders.FILES)
    },

    optimization: {
        // do not emit compiled assets that include errors
        emitOnErrors: false,
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin(), // enable HMR globally
        // This Plugin type checks our TS code, @babel/preset-typescript does not type check, it only transforms
        new ForkTsCheckerWebpackPlugin(constants.TS_CHECKER_DEV_CONFIG)
    ],
};
