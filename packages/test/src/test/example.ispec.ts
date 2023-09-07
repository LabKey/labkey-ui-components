/*
 * Copyright (c) 2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { PermissionRoles } from '@labkey/api';
import { hookServer, RequestOptions, successfulResponse } from '../integrationUtils';

// Declare the name of the LabKey project for these tests.
const PROJECT_NAME = 'LabKeyTestExampleProject';

// Acquire an instance of the configured server. This will use the configuration supplied
// either by command line or configuration file.
const server = hookServer(process.env);

// Initialize the server with the specified test project. Optionally, you can ensure any
// modules that are needed for the test to run are enabled in the test container.
beforeAll(async () => {
    return server.init(PROJECT_NAME, {
        ensureModules: ['query']
    });
});

// After the tests complete the test project can be cleaned up by calling teardown().
afterAll(async () => {
    return server.teardown();
});

describe('query-selectRows.api', () => {
    it('requires a query parameter', async () => {
        // Act
        // Make a POST request against the server. Here we expect a 404 response status code.
        const response = await server
            .post('query', 'selectRows.api', { schemaName: 'core' })
            .expect(404);

        // Assert
        const { exception } = response.body;
        expect(exception).toEqual('Query not specified');
    });
});

describe('query-executeSql.api', () => {
    let noPermissionsUserOptions: RequestOptions;
    let readerUserOptions: RequestOptions;

    beforeAll(async () => {
        // Create a new test container that tests can be run in
        const testContainer = await server.createTestContainer();

        // Create two users
        const noPermissionsUser = await server.createUser('hasnopermissions@lktestuser.com');
        const readerUser = await server.createUser('reader@lktestuser.com');

        // Assign permissions to a user in the test container
        await server.addUserToRole('reader@lktestuser.com', PermissionRoles.Reader, testContainer.path);

        noPermissionsUserOptions = {
            containerPath: testContainer.path,
            requestContext: await server.createRequestContext(noPermissionsUser),
        };

        readerUserOptions = {
            containerPath: testContainer.path,
            requestContext: await server.createRequestContext(readerUser),
        }
    });

    it('requires read permission', async () => {
        // Act
        // Make a POST request against the server. Here we expect a to be rejected because the user does not
        // have appropriate permissions.
        const response = await server.request(
            'query',
            'executeSql.api',
            (agent, url) => {
                return agent
                    .post(url)
                    .send({
                        schemaName: 'core',
                        sql: 'SELECT Name FROM core.containers',
                    })
                    .set('Content-Type', 'application/json')
                    .expect(403);
            },
            noPermissionsUserOptions
        );

        // Assert
        const { exception } = response.body;
        expect(exception).toContain('User does not have permission to perform this operation.');
    });

    it('successfully responds', async () => {
        // Act
        // Make a POST request against the server. Here we expect a successful response.
        const response = await server
            .post('query', 'executeSql.api', {
                schemaName: 'core',
                sql: 'SELECT Name FROM core.containers',
            }, readerUserOptions)
            .expect(successfulResponse);

        // Assert
        const { rowCount } = response.body;
        expect(rowCount).toEqual(1);
    });
});
