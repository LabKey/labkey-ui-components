/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
const { merge } = require('rspack-merge');
const baseConfig = require('./node_modules/@labkey/build/webpack/package.config');

module.exports = merge(baseConfig, {
    entry: {
        components: './src/index.ts',
    },
    output: {
        filename: '[name].js',
    },
});
