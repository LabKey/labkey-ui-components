import supertest from 'supertest';
import { ActionURL, Container, Utils } from '@labkey/api';

interface IntegrationTestServer {
    get: (controller: string, action: string, params?: any, containerPath?: string) => any;
    init: (lkProjectName: string) => Promise<void>;
    post: (controller: string, action: string, payload?: any, containerPath?: string) => any;
    teardown: () => Promise<void>;
}

const createContainer = async (server: any, containerPath: string, name: string): Promise<Container> => {
    const response = await postRequest(server, 'core', 'createContainer.api', {
        name
    }, containerPath).expect(200);

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

const init = async (server: any, projectName: string): Promise<void> => {
    // Get CSRF credentials
    const csrfResponse = await getRequest(server, 'login', 'whoAmI.api').expect(200);

    server.PROJECT_NAME = projectName;
    server.CSRF_TOKEN = csrfResponse.body.CSRF;

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
        const testContainer = await createContainer(server, project.path, Utils.generateUUID());
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

const postRequest = (server: any, controller: string, action: string, payload?: any, containerPath?: string): any => {
    const postRequest = server
        .post(ActionURL.buildURL(controller, action, containerPath ?? server.CONTAINER_PATH))
        .send(payload)
        .set('Content-Type', 'application/json');

    return withAuth(server, postRequest);
};

const teardown = async (server: any): Promise<void> => {
    if (server.INITIALIZED) {
        try {
            return await postRequest(server, 'core', 'deleteContainer.api', undefined, server.PROJECT_NAME).expect(200);
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
