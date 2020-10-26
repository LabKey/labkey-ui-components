/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const lkModule = process.env.LK_MODULE;
const lkModuleContainer = process.env.LK_MODULE_CONTAINER;
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// This path assumes the enlistment in labkey-ui-components is a sibling of the root of the LabKey enlistment.
// TODO figure out how we can make this more flexible and get an absolute path from the dev based on their setup
const labkeyUIComponentsRelPath = (lkModuleContainer ? "../../../../../" : "../../../../") + "labkey-ui-components/packages/components";
const labkeyUIComponentsPath = process.env.LINK ? path.resolve(labkeyUIComponentsRelPath) : path.resolve("./node_modules/@labkey/components");
console.log("Using @labkey/components path: " + labkeyUIComponentsPath);

const freezerManagerRelPath = (lkModuleContainer ? "../../../../../../" : "../../../../../") + "inventory/packages/freezermanager";
const freezerManagerPath = process.env.LINK ? path.resolve(__dirname, freezerManagerRelPath) : path.resolve("./node_modules/@labkey/freezermanager");
console.log("Using @labkey/freezermanager path: " + freezerManagerPath);

const watchPort = process.env.WATCH_PORT || 3001;

module.exports = {
    labkeyUIComponentsPath: labkeyUIComponentsPath,
    freezerManagerPath: freezerManagerPath,
    watchPort: watchPort,
    context: function(dir) {
        return path.resolve(dir, '..');
    },
    extensions: {
        TYPESCRIPT: [ '.jsx', '.js', '.tsx', '.ts' ]
    },
    loaders: {
        STYLE_LOADERS: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },{
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: true
                        }
                    },{
                        loader: 'resolve-url-loader'
                    },{
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true
                        }
                    }]
            },

            { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
            { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/octet-stream" },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file-loader" },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=image/svg+xml" },
            { test: /\.png(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=image/png" }
        ],
        STYLE_LOADERS_DEV: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },{
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: true
                        }
                    },{
                        loader: 'resolve-url-loader'
                    },{
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true
                        }
                    }]
            },

            { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
            { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/octet-stream" },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file-loader" },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=image/svg+xml" },
            { test: /\.png(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=image/png" }
        ],
        TYPESCRIPT_LOADERS: [
            {
                test: /^(?!.*spec\.tsx?$).*\.tsx?$/,
                loaders: [{
                    loader: 'babel-loader',
                    options: {
                        babelrc: false,
                        cacheDirectory: true,
                        presets: [
                            [
                                "@babel/preset-env",
                                {
                                    // support async/await
                                    "targets": {
                                        "node": "10"
                                    }
                                }
                            ],
                            "@babel/preset-react"
                        ]
                    }
                },{
                    loader: 'ts-loader',
                    options: {
                        onlyCompileBundledFiles: true
                        // this flag and the test regex will make sure that test files do not get bundled
                        // see: https://github.com/TypeStrong/ts-loader/issues/267
                    }
                }]
            }
        ],
        TYPESCRIPT_LOADERS_DEV: [
            {
                test: /^(?!.*spec\.tsx?$).*\.tsx?$/,
                loaders: [{
                    loader: 'babel-loader',
                    options: {
                        babelrc: false,
                        cacheDirectory: true,
                        presets: [
                            [
                                "@babel/preset-env",
                                {
                                    // support async/await
                                    "targets": {
                                        "node": "10"
                                    }
                                }
                            ],
                            "@babel/preset-react"
                        ],
                        plugins: [
                            "react-hot-loader/babel"
                        ]
                    }
                },{
                    loader: 'ts-loader',
                    options: {
                        // override default "compilerOptions" declared in tsconfig.json
                        compilerOptions: {
                            "baseUrl": ".",
                            "paths": {
                                "immutable": [labkeyUIComponentsPath + "/node_modules/immutable"],
                                "@labkey/components": [labkeyUIComponentsPath]
                            }
                        },
                        onlyCompileBundledFiles: true
                        // this flag and the test regex will make sure that test files do not get bundled
                        // see: https://github.com/TypeStrong/ts-loader/issues/267
                    }
                }]
            }
        ]
    },
    outputPath: function(dir) {
        return path.resolve(dir, '../resources/web/' + lkModule + '/gen');
    },
    processEntries: function(entryPoints) {
        return entryPoints.apps.reduce((entries, app) => {
            entries[app.name] = app.path + '/app.tsx';
            return entries;
        }, {});
    },
    processPlugins: function(entryPoints) {
        let allPlugins = entryPoints.apps.reduce((plugins, app) => {
            // Generate dependencies via lib.xml rather than view.xml
            if (app.generateLib === true) {
                plugins = plugins.concat([
                    new HtmlWebpackPlugin({
                        inject: false,
                        module: lkModule,
                        name: app.name,
                        title: app.title,
                        permission: app.permission,
                        viewTemplate: app.template,
                        filename: '../../../web/' + lkModule + '/gen/' + app.name + '.lib.xml',
                        template: 'node_modules/@labkey/build/webpack/lib.template.xml'
                    }),
                ]);
            } else {
                plugins = plugins.concat([
                    new HtmlWebpackPlugin({
                        inject: false,
                        module: lkModule,
                        name: app.name,
                        title: app.title,
                        permission: app.permission,
                        viewTemplate: app.template,
                        filename: '../../../views/' + app.name + '.view.xml',
                        template: 'node_modules/@labkey/build/webpack/app.view.template.xml'
                    }),
                    new HtmlWebpackPlugin({
                        inject: false,
                        filename: '../../../views/' + app.name + '.html',
                        template: 'node_modules/@labkey/build/webpack/app.template.html'
                    }),
                    new HtmlWebpackPlugin({
                        inject: false,
                        mode: 'dev',
                        module: lkModule,
                        name: app.name,
                        title: app.title,
                        permission: app.permission,
                        viewTemplate: app.template,
                        filename: '../../../views/' + app.name + 'Dev.view.xml',
                        template: 'node_modules/@labkey/build/webpack/app.view.template.xml'
                    }),
                    new HtmlWebpackPlugin({
                        inject: false,
                        mode: 'dev',
                        port: watchPort,
                        name: app.name,
                        filename: '../../../views/' + app.name + 'Dev.html',
                        template: 'node_modules/@labkey/build/webpack/app.template.html'
                    })
                ]);
            }
            return plugins;
        }, []);

        allPlugins.push(new MiniCssExtractPlugin());

        return allPlugins;
    }
};
