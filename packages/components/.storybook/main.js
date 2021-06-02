module.exports = {
    core: { builder: 'webpack5' },
    stories: [ '../src/stories/**/*.stories.@(ts|tsx)' ],
    addons: [ '@storybook/addon-essentials', '@storybook/addon-knobs' ],
    typescript: {
        check: false,
        reactDocgen: false,
    },
    webpackFinal: (config) => {
        // `mode` has a value of 'DEVELOPMENT' or 'PRODUCTION'
        // You can change the configuration based on that.
        // 'PRODUCTION' is used when building the static version of storybook.

        config.devtool = 'eval-source-map';

        config.module.rules.push({
            test: /\.tsx?$/,
            use: [
                'babel-loader',
                {
                    loader: 'ts-loader',
                    options: {
                        compilerOptions: {
                            declaration: false,
                        },
                        // this flag and the test regex will make sure that test files do not get bundled
                        // see: https://github.com/TypeStrong/ts-loader/issues/267
                        onlyCompileBundledFiles: true
                    }
                }
            ],
            exclude: /node_modules/
        });

        config.module.rules.push({
            test: /\.scss$/,
            use: ['style-loader', 'css-loader', 'sass-loader'],
        });

        config.resolve.extensions.push('.ts', '.tsx', '.scss');

        config.optimization = { minimize: false };

        // Return the altered config
        return config;
    }
}
