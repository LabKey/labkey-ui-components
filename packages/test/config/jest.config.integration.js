module.exports = {
    "globals": {
        "LABKEY": {
            "moduleContext": {},
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
        "./test/js/integration.setup.js",
    ],
    "setupFilesAfterEnv": [
        "./test/js/setup.ts"
    ],
    "testPathIgnorePatterns": [
        "/node_modules/",
        "./test/js/globals.js"
    ],
    "testRegex": "(\\.ispec)\\.(ts|tsx)$",
    "preset": "ts-jest",
    "rootDir": "../../",
    "testMatch": null
};
