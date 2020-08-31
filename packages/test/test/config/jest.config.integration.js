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
    "testPathIgnorePatterns": [
        "/node_modules/",
    ],
    "testRegex": "(\\.ispec)\\.(ts)$",
    "preset": "ts-jest",
    "rootDir": "../../",
    "testMatch": null,
    "testResultsProcessor": "jest-teamcity-reporter"
};
