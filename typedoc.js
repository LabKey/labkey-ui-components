/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
module.exports = {
    out: './docs',
    theme: "default",
    mode: "modules",
    exclude: [
        "**/*+(wrapper|wrapper-dom|.spec|.stories).ts*",
        "**/stories/**",
        "**/__snapshots__/**",
        "**/__mocks__/**"
    ],
    externalPattern: "**/node_modules/** ",
    excludeExternals: true,
    excludePrivate: true,
    ignoreCompilerErrors: true
};
