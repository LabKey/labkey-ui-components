/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
module.exports = {
    name: "@labkey/components (public)",
    readme: "./docs/public.md",
    toc: [
        "DetailPanelWithModel",
        "GridPanel",
        "GridPanelWithModel",
        "QueryConfig",
        "QueryModel",
        "withQueryModels",
    ],
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
};
