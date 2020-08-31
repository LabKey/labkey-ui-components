module.exports = {
    "globals": {
        "LABKEY": {
            "moduleContext": {},
            "user": {
                "id": 1004
            }
        }
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
    "testPathIgnorePatterns": [
        "/node_modules/",
        "./test/js/globals.js"
    ],
    "testRegex": "(\\.ispec)\\.(ts|tsx)$",
    "preset": "ts-jest",
    "rootDir": "../../",
    "testMatch": null,
    "testResultsProcessor": "jest-teamcity-reporter"
};
