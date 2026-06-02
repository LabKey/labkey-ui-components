/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
module.exports = {
    "globals": {
        "LABKEY": {}
    },
    "moduleFileExtensions": [
        "js",
        "ts",
        "tsx"
    ],
    "moduleDirectories": [
        "node_modules"
    ],
    "setupFiles": [
        "./config/integration.setup.js"
    ],
    "setupFilesAfterEnv": [
        "./config/integration.setup.afterenv.js",
    ],
    "testEnvironment": "jsdom",
    "testPathIgnorePatterns": [
        "/node_modules/",
    ],
    "testRegex": "(\\.ispec)\\.(ts)$",
    "preset": "ts-jest",
    "rootDir": "../../",
    "testMatch": null,
    "testResultsProcessor": "jest-teamcity-reporter"
};
