// Run all tests with timezone set to UTC
// https://stackoverflow.com/a/56482581
process.env.TZ = 'UTC';

module.exports = {
    globals: {
        LABKEY: {
            contextPath: '/labkey',
            container: {
                path: '/DefaultTestContainer',
                formats: {
                    dateFormat: "yyyy-MM-dd",
                    dateTimeFormat: "yyyy-MM-dd HH:mm",
                    timeFormat: "HH:mm"
                }
            },
            project: {
                rootId: 'ROOTID'
            },
            user: {
                id: 1004
            },
            helpLinkPrefix: 'https://www.labkey.org/Documentation/wiki-page.view?name=',
            moduleContext: {
                study: {
                    subject: {
                        nounPlural: 'Participants',
                        tableName: 'Participant',
                        nounSingular: 'Participant',
                        columnName: 'ParticipantId'
                    },
                    timepointType: 'VISIT'
                },
                // Makes tests appear to be running within an SM app
                samplemanagement: {}
            }
        },
    },
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    roots: ['<rootDir>'],
    setupFilesAfterEnv: [
        './src/test/jest.setup.ts'
    ],
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: [
        '/node_modules/'
    ],
    testRegex: '(\\.(test))\\.(ts|tsx)$',
    testResultsProcessor: 'jest-teamcity-reporter',
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'node_modules/@labkey/build/webpack/tsconfig.test.json',
            }
        ],
    },
};
