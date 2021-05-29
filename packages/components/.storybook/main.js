module.exports = {
    core: { builder: 'webpack5' },
    stories: [
        // TODO: Re-enable all stories. Currently, running into an https://github.com/storybookjs/storybook/issues/12208
        '../src/stories/AddEntityButton.stories.tsx',
        '../src/stories/AssayDesignDeleteConfirmModal.stories.tsx',
        '../src/stories/HeatMap.stories.tsx',
    ],
    // stories: [ '../src/stories/**/*.stories.@(ts|tsx)' ],
    addons: [ '@storybook/addon-essentials', '@storybook/addon-knobs' ],
    typescript: {
        check: false,
        // checkOptions: {},
        reactDocgen: false,
        // reactDocgenTypescriptOptions: {
        //     shouldExtractLiteralValuesFromEnum: true,
        //     propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
        // },
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
