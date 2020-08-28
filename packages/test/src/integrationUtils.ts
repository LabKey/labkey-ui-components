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
import supertest from 'supertest';
import { ActionURL, Container, Utils } from '@labkey/api';

import { sleep } from './utils';

declare var LABKEY;

export interface IntegrationTestServer {
    get: (controller: string, action: string, params?: any, containerPath?: string) => any;
    init: (lkProjectName: string, containerOptions?: any) => Promise<void>;
    post: (controller: string, action: string, payload?: any, containerPath?: string, postProcessor?: (postRequest: any, payload: any) => any) => any;
    teardown: () => Promise<void>;
}

const createContainer = async (server: any, containerPath: string, name: string, containerOptions?: any /* Security.CreateContainerOptions */): Promise<Container> => {
    const response = await postRequest(server, 'core', 'createContainer.api', {
        ...containerOptions,
        name
    }, containerPath).expect(successfulResponse);

    return response.body;
};

const getRequest = (server: any, controller: string, action: string, params?: any, containerPath?: string): any => {
    const url = ActionURL.buildURL(controller, action, containerPath ?? server.CONTAINER_PATH, params);
    return withAuth(server, server.get(url));
};

export const hookServer = (): IntegrationTestServer => {
    // Override the global context path -- required for ActionURL to work
    LABKEY.contextPath = process.env.INTEGRATION_CONTEXT_PATH;

    const location = process.env.INTEGRATION_SERVER;
    const server = supertest(location);
    server.LOCATION = location;

    return {
        get: getRequest.bind(this, server),
        init: init.bind(this, server),
        post: postRequest.bind(this, server),
        teardown: teardown.bind(this, server),
    };
};

const init = async (server: any, projectName: string, containerOptions?: any): Promise<void> => {
    server.PROJECT_NAME = projectName;

    // Get CSRF credentials
    server.CSRF_TOKEN = await initCSRF(server);

    // Ensure project exists
    let project: Container;
    const getProjectResponse = await getRequest(server, 'project', 'getContainers.api', undefined, server.PROJECT_NAME).send();

    // project-getContainers.api returns HTML if the container DNE. Process against status codes directly.
    if (getProjectResponse.status !== 200) {
        if (getProjectResponse.status === 404) {
            try {
                project = await createContainer(server, '/', server.PROJECT_NAME);
            }
            catch (e) {
                throw new Error('Failed to initialize integration test. Unable to create test project.');
            }
        } else {
            throw new Error('Failed to initialize integration test. Retrieving test project failed in an unexpected way.');
        }
    } else {
        project = getProjectResponse.body;
    }

    // Create test container
    try {
        const testContainer = await createContainer(server, project.path, Utils.generateUUID(), containerOptions);
        server.CONTAINER_PATH = testContainer.path;
    }
    catch (e) {
        throw new Error('Failed to initialize integration test. Unable to create test container.');
    }

    server.INITIALIZED = true;

    // Log useful information
    console.log('server:', server.LOCATION);
    console.log('container path:', server.CONTAINER_PATH);
};

const initCSRF = async (server: any): Promise<string> => {
    const MAX_RETRIES = 5;
    let lastResponse;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            let whoAmIResponse = await getRequest(server, 'login', 'whoAmI.api').send();

            if (whoAmIResponse.status === 200) {
                return whoAmIResponse.body.CSRF;
            } else {
                lastResponse = whoAmIResponse;
            }
        } catch (e) {
            /* continue retrying */
        }

        await sleep(5000);
    }

    successfulResponse(lastResponse);

    throw new Error('Failed to initialize CSRF. Unable to make successful request to login-whoAmI.api.');
};

const postRequest = (server: any, controller: string, action: string, payload?: any, containerPath?: string, postProcessor?: (postRequest: any, payload: any) => any): any => {
    let postRequest = server
        .post(ActionURL.buildURL(controller, action, containerPath ?? server.CONTAINER_PATH));

    if (postProcessor) {
        postRequest = postProcessor(postRequest, payload);
    } else {
        postRequest = postRequest.send(payload).set('Content-Type', 'application/json');
    }

    return withAuth(server, postRequest);
};

/**
 * Utility that provides improved error messaging in the event of
 * an unsuccessful response when a successful (statusCode === 200) response is expected.
 */
export const successfulResponse = (response: any): boolean => {
    const { statusCode } = response;

    if (statusCode !== 200) {
        const { body, request } = response;
        let errorParts = [`Expected status 200. Received status ${statusCode}.`];

        if (body.exception) {
            errorParts.push(`Exception: "${body.exception}".`);
        }

        if (request?.url) {
            errorParts.push(`Endpoint: "${request.url}".`);
        }

        throw new Error(errorParts.join('\n'));
    }

    return true;
};

const teardown = async (server: any): Promise<void> => {
    if (server.INITIALIZED) {
        try {
            return await postRequest(server, 'core', 'deleteContainer.api', undefined, server.PROJECT_NAME).expect(successfulResponse);
        }
        catch (e) {
            throw new Error('Failed to teardown integration test. Unable to delete test project.');
        }
    }
};

const withAuth = (server: any, request: any): any => {
    const { INTEGRATION_AUTH_PASS, INTEGRATION_AUTH_USER } = process.env;
    request = request.auth(INTEGRATION_AUTH_USER, INTEGRATION_AUTH_PASS);

    if (server.CSRF_TOKEN) {
        request = request
            .set('X-LABKEY-CSRF', server.CSRF_TOKEN)
            .set('Cookie', `X-LABKEY-CSRF=${server.CSRF_TOKEN}`);
    }

    return request;
};
