/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
module.exports = {
    name: "@labkey/components (internal)",
    readme: "none",
    theme: "default",
    mode: "file",
    includeVersion: true,
    ignoreCompilerErrors: true,
    exclude: [
        "**/*+(wrapper|wrapper-dom|.spec|.stories).ts*",
        "**/stories/**",
        "**/__snapshots__/**",
        "**/__mocks__/**",
        "**/test/**",
    ],
    externalPattern: "**/node_modules/** ",
    excludeExternals: true,
    // excludePrivate: true,
    // excludeProtected: true,
    // excludeNotExported: true,
};
