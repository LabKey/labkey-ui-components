/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
// Run all tests with timezone set to UTC
// https://stackoverflow.com/a/56482581
process.env.TZ = 'UTC';

module.exports = {
    globals: {
        LABKEY: {
            contextPath: '/labkey',
            container: {
                id: 'e28ed3a3-4d74-103b-9678-6554da263543',
                path: '/DefaultTestContainer',
                parentId: '01b94403-4179-1039-a799-ea54f212702c',
                parentPath: '/ParentTestContainer',
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
                samplemanagement: {},
                core : { primaryApplicationId: "SampleManager", productKey: "sampleManagerStarter" }
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
                tsconfig: 'node_modules/@labkey/build/configs/tsconfig.test.json',
            }
        ],
    },
};
