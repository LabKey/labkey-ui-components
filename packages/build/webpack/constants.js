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

// Conditionalize the path to use for the @labkey packages based on if the user wants to LINK their labkey-ui-components repo.
// NOTE: the LABKEY_UI_COMPONENTS_HOME environment variable must be set for this to work.
let labkeyUIComponentsPath = path.resolve("./node_modules/@labkey/components");
let freezerManagerPath = path.resolve("./node_modules/@labkey/freezermanager");
let workflowPath = path.resolve("./node_modules/@labkey/workflow");
if (process.env.LINK) {
    if (process.env.LABKEY_UI_COMPONENTS_HOME === undefined) {
        throw "ERROR: You must set your LABKEY_UI_COMPONENTS_HOME environment variable in order to link your @labkey packages.";
    }

    labkeyUIComponentsPath = process.env.LABKEY_UI_COMPONENTS_HOME + "/packages/components";

    const freezerManagerRelPath = (lkModuleContainer ? "../../../../../../" : "../../../../../") + "inventory/packages/freezermanager";
    freezerManagerPath = path.resolve(__dirname, freezerManagerRelPath);

    const workflowRelPath = (lkModuleContainer ? "../../../../../../" : "../../../../../") + "sampleManagement/packages/workflow";
    workflowPath = path.resolve(__dirname, workflowRelPath);
}
if (process.env.npm_package_dependencies__labkey_components) {
    console.log("Using @labkey/components path: " + labkeyUIComponentsPath);
}
if (process.env.npm_package_dependencies__labkey_freezermanager) {
    console.log("Using @labkey/freezermanager path: " + freezerManagerPath);
}
if (process.env.npm_package_dependencies__labkey_workflow) {
    console.log("Using @labkey/workflow path: " + workflowPath);
}

const watchPort = process.env.WATCH_PORT || 3001;

module.exports = {
    labkeyUIComponentsPath: labkeyUIComponentsPath,
    freezerManagerPath: freezerManagerPath,
    workflowPath: workflowPath,
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
                                "@labkey/components": [labkeyUIComponentsPath],
                                "@labkey/freezermanager": [freezerManagerPath],
                                "@labkey/workflow": [workflowPath]
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
                        permissionClasses: app.permissionClasses,
                        viewTemplate: app.template,
                        filename: '../../../views/gen/' + app.name + '.view.xml',
                        template: 'node_modules/@labkey/build/webpack/app.view.template.xml'
                    }),
                    new HtmlWebpackPlugin({
                        inject: false,
                        filename: '../../../views/gen/' + app.name + '.html',
                        template: 'node_modules/@labkey/build/webpack/app.template.html'
                    }),
                    new HtmlWebpackPlugin({
                        inject: false,
                        mode: 'dev',
                        module: lkModule,
                        name: app.name,
                        title: app.title,
                        permission: app.permission,
                        permissionClasses: app.permissionClasses,
                        viewTemplate: app.template,
                        filename: '../../../views/gen/' + app.name + 'Dev.view.xml',
                        template: 'node_modules/@labkey/build/webpack/app.view.template.xml'
                    }),
                    new HtmlWebpackPlugin({
                        inject: false,
                        mode: 'dev',
                        port: watchPort,
                        name: app.name,
                        filename: '../../../views/gen/' + app.name + 'Dev.html',
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
