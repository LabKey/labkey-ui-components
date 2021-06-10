/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const FREEZER_MANAGER_DIRS = ['inventory', 'packages', 'freezermanager', 'src'];
const WORKFLOW_DIRS = ['sampleManagement', 'packages', 'workflow', 'src'];
const cwd = path.resolve('./').split(path.sep);
const lkModule = cwd[cwd.length - 1];

// Default to the @labkey packages in the node_moules directory.
// If LINK is set we configure the paths of @labkey modules to point to the source files (see below), which enables
// hot module reload to work across packages.
// NOTE: the LABKEY_UI_COMPONENTS_HOME environment variable must be set for this to work.
let labkeyUIComponentsPath = path.resolve('./node_modules/@labkey/components');
let freezerManagerPath = path.resolve('./node_modules/@labkey/freezermanager');
let workflowPath = path.resolve('./node_modules/@labkey/workflow');
const tsconfigPath = path.resolve('./node_modules/@labkey/build/webpack/tsconfig.json');

if (process.env.LINK) {
    if (process.env.LABKEY_UI_COMPONENTS_HOME === undefined) {
        throw 'ERROR: You must set your LABKEY_UI_COMPONENTS_HOME environment variable in order to link your @labkey packages.';
    }

    labkeyUIComponentsPath = process.env.LABKEY_UI_COMPONENTS_HOME + '/packages/components/src';
    // lastIndexOf just in case someone is weird and has their LKS deployment under a directory named modules.
    const lkModulesPath = cwd.slice(0, cwd.lastIndexOf('modules') + 1);
    freezerManagerPath = lkModulesPath.concat(FREEZER_MANAGER_DIRS).join(path.sep);
    workflowPath = lkModulesPath.concat(WORKFLOW_DIRS).join(path.sep);

    console.log('Using @labkey/components path:', labkeyUIComponentsPath);
    console.log('Using @labkey/freezermanager path:', freezerManagerPath);
    console.log('Using @labkey/workflow path:', workflowPath);
}

const watchPort = process.env.WATCH_PORT || 3001;

// These minification options are a re-declaration of the default minification options
// for the HtmlWebpackPlugin with the addition of `caseSensitive` because LabKey's
// view templates can contain case-sensitive elements (e.g. `<permissionClasses>`).
// For more information see https://github.com/jantimon/html-webpack-plugin#minification.
const minifyTemplateOptions = {
    caseSensitive: true,
    collapseWhitespace: process.env.NODE_ENV === 'production',
    keepClosingSlash: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true
}

const SASS_PLUGINS = [
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
    }
];

const BABEL_PLUGINS = [
    // These make up @babel/preset-react, we cannot use preset-react because we need to ensure that the
    // typescript plugins run before the class properties plugins in order for allowDeclareFields to work
    // properly. We can use preset-react and stop using allowDeclareFields if we stop using Immutable.
    '@babel/plugin-syntax-jsx',
    '@babel/plugin-transform-react-jsx',
    '@babel/plugin-transform-react-display-name',

    // These make up @babel/preset-typescript
    ['@babel/plugin-transform-typescript', {
        allExtensions: true, // required when using isTSX
        allowDeclareFields: true,
        isTSX: true,
    }],

    '@babel/proposal-class-properties',
    '@babel/proposal-object-rest-spread',
];

const BABEL_CONFIG = {
    loader: 'babel-loader',
    options: {
        babelrc: false,
        cacheDirectory: true,
        presets: [
            [
                '@babel/preset-env',
                {
                    // support async/await
                    'targets': 'last 2 versions, not dead, not IE 11, > 5%',
                }
            ],
        ],
        plugins: BABEL_PLUGINS,
    }
};

const BABEL_DEV_CONFIG = {
    ...BABEL_CONFIG,
    options: {
        ...BABEL_CONFIG.options,
        plugins: ['react-hot-loader/babel'].concat(BABEL_PLUGINS),
    }
};

const TS_CHECKER_CONFIG = {
    typescript: {
        configFile: tsconfigPath,
        context: '.',
        diagnosticOptions: {
            semantic: true,
            syntactic: true,
        },
        mode: "write-references",
    }
};

const TS_CHECKER_DEV_CONFIG = {
    ...TS_CHECKER_CONFIG,
    typescript: {
        ...TS_CHECKER_CONFIG.typescript,
        configOverwrite: {
            compilerOptions: {
                "paths": {
                    "@labkey/components": [labkeyUIComponentsPath],
                    "@labkey/freezermanager": [freezerManagerPath],
                    "@labkey/workflow": [workflowPath]
                }
            }
        },
    }
};

module.exports = {
    lkModule,
    labkeyUIComponentsPath,
    freezerManagerPath,
    workflowPath,
    tsconfigPath,
    watchPort,
    TS_CHECKER_CONFIG,
    TS_CHECKER_DEV_CONFIG,
    context: path.resolve(lkModule, '..'),
    extensions: {
        TYPESCRIPT: [ '.jsx', '.js', '.tsx', '.ts' ]
    },
    loaders: {
        FILES: [
            {
                test: /\.(woff|woff2)$/,
                type: 'asset',
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset',
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource',
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset',
            },
            {
                test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset',
            }
        ],
        STYLE: [
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            },
            {
                test: /\.scss$/,
                use: [MiniCssExtractPlugin.loader].concat(SASS_PLUGINS),
            },
        ],
        STYLE_DEV: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.scss$/,
                use: ['style-loader'].concat(SASS_PLUGINS),
            },
        ],
        TYPESCRIPT: [
            {
                test: /^(?!.*spec\.tsx?$).*\.tsx?$/,
                use: [BABEL_CONFIG]
            }
        ],
        TYPESCRIPT_DEV: [
            {
                test: /^(?!.*spec\.tsx?$).*\.tsx?$/,
                use: [BABEL_DEV_CONFIG]
            }
        ]
    },
    aliases: {
        LABKEY_PACKAGES: {
            '@labkey/components-scss': labkeyUIComponentsPath + '/dist/assets/scss/theme',
            '@labkey/components-app-scss': labkeyUIComponentsPath + '/dist/assets/scss',
            '@labkey/freezermanager-scss': freezerManagerPath + '/dist/assets/scss/theme',
            '@labkey/workflow-scss': workflowPath + '/dist/assets/scss/theme',
        },
        LABKEY_PACKAGES_DEV: {
            // Note that for modules that don't have these packages, the aliases are just ignored and don't
            // seem to cause any problems.
            '@labkey/components': labkeyUIComponentsPath,
            '@labkey/freezermanager': freezerManagerPath,
            '@labkey/workflow': workflowPath,

            // need to set the path based on the LINK var
            '@labkey/components-scss': labkeyUIComponentsPath + (process.env.LINK ? '/theme' : '/dist/assets/scss/theme'),
            '@labkey/components-app-scss': labkeyUIComponentsPath + (process.env.LINK ? '/internal/app/scss' : '/dist/assets/scss'),
            '@labkey/freezermanager-scss': freezerManagerPath + (process.env.LINK ? '/theme' : '/dist/assets/scss/theme'),
            '@labkey/workflow-scss': workflowPath + (process.env.LINK ? '/theme' : '/dist/assets/scss/theme'),
        },
    },
    outputPath: path.resolve('./resources/web/gen'),
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
                        filename: '../../web/gen/' + app.name + '.lib.xml',
                        template: 'node_modules/@labkey/build/webpack/lib.template.xml',
                        minify: minifyTemplateOptions
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
                        filename: '../../views/gen/' + app.name + '.view.xml',
                        template: 'node_modules/@labkey/build/webpack/app.view.template.xml',
                        minify: minifyTemplateOptions
                    }),
                    new HtmlWebpackPlugin({
                        inject: false,
                        filename: '../../views/gen/' + app.name + '.html',
                        template: 'node_modules/@labkey/build/webpack/app.template.html',
                        minify: minifyTemplateOptions
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
                        filename: '../../views/gen/' + app.name + 'Dev.view.xml',
                        template: 'node_modules/@labkey/build/webpack/app.view.template.xml',
                        minify: minifyTemplateOptions
                    }),
                    new HtmlWebpackPlugin({
                        inject: false,
                        mode: 'dev',
                        port: watchPort,
                        name: app.name,
                        filename: '../../views/gen/' + app.name + 'Dev.html',
                        template: 'node_modules/@labkey/build/webpack/app.template.html',
                        minify: minifyTemplateOptions
                    })
                ]);
            }
            return plugins;
        }, []);

        allPlugins.push(new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
        }));

        allPlugins.push(new ForkTsCheckerWebpackPlugin(TS_CHECKER_CONFIG));

        return allPlugins;
    }
};
