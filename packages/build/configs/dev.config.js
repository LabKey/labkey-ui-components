/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
const entryPoints = require('../../../../src/client/entryPoints');
const constants = require('./constants');

module.exports = {
    context: constants.context,
    ignoreWarnings: constants.ignoreWarnings,
    mode: 'development',
    devtool: 'eval',
    entry: constants.processEntries(entryPoints),
    output: {
        path: constants.outputPath,
        publicPath: './', // allows context path to resolve in both js/css
        filename: '[name].[contenthash].js'
    },
    module: {
        rules: constants.loaders.TYPESCRIPT.concat(constants.loaders.STYLE, constants.loaders.FILES),
    },
    resolve: {
        alias: constants.aliases.LABKEY_PACKAGES,
        extensions: constants.extensions.TYPESCRIPT
    },
    plugins: constants.processPlugins(entryPoints),
};
