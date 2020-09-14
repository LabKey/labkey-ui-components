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
import supertest, { SuperTest, Test } from 'supertest';
import { ActionURL, Container, Utils } from '@labkey/api';

import { sleep } from './utils';

declare var LABKEY;

type AgentProvider = (agent: SuperTest<Test>, url: string) => Test;

interface CreateNewUser {
    email: string;
    isNew: boolean;
    message: string;
}

interface UserCredentials {
    password: string;
    username: string;
}

class RequestContext implements UserCredentials {
    csrfToken?: string;
    password: string;
    username: string;

    constructor(config: Partial<RequestContext>) {
        this.csrfToken = config.csrfToken;
        this.password = config.password;
        this.username = config.username;
    }
}

// It is a bit odd to define this enumeration here. We could consider
// moving it to @labkey/api (similar to Security.PermissionTypes).
export enum SecurityRole {
    // All enumeration values are expected to be a prefixed name of
    // their corollary Java class role.
    Author = 'Author',
    Editor = 'Editor',
    FolderAdmin = 'FolderAdmin',
    ProjectAdmin = 'ProjectAdmin',
    Reader = 'Reader',
}

interface ServerContext {
    agent: SuperTest<Test>;
    containerPath?: string;
    createdUsers: string[];
    defaultContext: RequestContext;
    location: string;
    projectPath?: string;
}

export interface RequestOptions {
    containerPath?: string;
    requestContext?: RequestContext;
}

export interface IntegrationTestServer {
    /**
     * Add a user (by their email address) to a permission's role in a the test container. This allows for
     * testing of users with different permissions in the test container.
     */
    addUserToRole: (email: string, role: SecurityRole, containerPath?: string) => Promise<void>;
    /**
     * Creates a RequestContext that can be used for subsequent server requests (e.g. get, post). This will
     * initialize the CSRF token to ensure that the server requests authenticate as expected.
     */
    createRequestContext: (config: Partial<RequestContext>) => Promise<RequestContext>;
    /**
     * Creates a new Container on the server within the test Project. This allows for testing across multiple
     * containers or creating a separate container for a test suite.
     */
    createTestContainer: (containerOptions?: any) => Promise<Container>;
    /**
     * Create a new user account on the server with the specified credentials. If the account already exists, then
     * the account will be deleted and re-created to ensure credentials and permissions are configured as expected.
     */
    createUser: (email: string, password: string) => Promise<UserCredentials>;
    /** Make a GET request against the server. */
    get: (controller: string, action: string, params?: any, options?: RequestOptions) => Test;
    /** Initializes the server for the test run. This is required to be called prior to any tests running. */
    init: (lkProjectName: string, containerOptions?: any) => Promise<void>;
    /**
     * Make a POST request against the server. This will set the header "Content-Type" to "application/json"
     * so the payload is expected to be a JSON serializable object. For other usages of POST use `request()` instead.
     */
    post: (controller: string, action: string, payload?: any, options?: RequestOptions) => Test;
    /**
     * For more advanced requests (beyond simple GET/POST) this method provides access to superagent directly.
     * The URL is composed from the provided controller, action, and containerPath and is made available
     * via the `AgentProvider`.
     * See superagent documentation for API: https://visionmedia.github.io/superagent/
     */
    request: (controller: string, action: string, agentProvider: AgentProvider, options?: RequestOptions) => Test;
    /**
     * Tears down any test artifacts on the server. This is intended to be called after the tests complete.
     * Specifically, it deletes the test Project along with any test containers created during the test run.
     * Additionally, deletes all user accounts created during the test run.
     */
    teardown: () => Promise<void>;
}

const addUserToRole = async (ctx: ServerContext, email: string, role: SecurityRole, containerPath?: string): Promise<void> => {
    await postRequest(ctx, 'security', 'addAssignment.api', {
        email,
        roleClassName: `org.labkey.api.security.roles.${SecurityRole[role]}Role`,
    }, { containerPath: containerPath ?? ctx.containerPath }).expect(successfulResponse);
};

const _createContainer = async (ctx: ServerContext, containerPath: string, name: string, containerOptions?: any /* Security.CreateContainerOptions */): Promise<Container> => {
    const response = await postRequest(ctx, 'core', 'createContainer.api', {
        ...containerOptions,
        name
    }, { containerPath }).expect(successfulResponse);

    return response.body;
};

const createRequestContext = async (ctx: ServerContext, config: Partial<RequestContext>) => {
    const requestCtx = new RequestContext(config);
    requestCtx.csrfToken = await initCSRF(ctx);
    return requestCtx;
};

const createTestContainer = async (ctx: ServerContext, containerOptions?: any /* Security.CreateContainerOptions */): Promise<Container> => {
    if (!ctx.projectPath) {
        throw new Error('Failed to create test container. Project must be initialized via init() prior to creating a test container.');
    }

    return await _createContainer(ctx, ctx.projectPath, Utils.generateUUID(), containerOptions);
};

const createUser = async (ctx: ServerContext, email: string, password: string): Promise<UserCredentials> => {
    // Delete user (if the account already exists)
    // This ensures the given user's password and subsequent permissions are as expected
    await deleteUser(ctx, email);

    // Create the user
    const createUserResponse = await postRequest(ctx, 'security', 'createNewUser.api', {
        email,
        sendEmail: false,
    }).expect(successfulResponse);

    // Expect to create only one user
    const { users } = createUserResponse.body;
    if (users.length !== 1) {
        throw new Error(`Failed to create user. Unexpected number of users returned after creating account for "${email}".`);
    }

    await setInitialPassword(ctx, users[0], password);

    ctx.createdUsers.push(email);

    return { username: email, password };
};

const deleteUser = async (ctx: ServerContext, email: string): Promise<void> => {
    const userId = await getUserId(ctx, email);

    if (userId !== undefined) {
        await postRequest(ctx, 'security', 'deleteUser.api', { id: userId }, { containerPath: '/' })
            .expect(successfulResponse);
    }
};

const getRequest = (
    ctx: ServerContext,
    controller: string,
    action: string,
    params?: any,
    options?: RequestOptions
): Test => {
    const url = ActionURL.buildURL(controller, action, options?.containerPath ?? ctx.containerPath, params);
    return request(ctx, controller, action, agent => agent.get(url), options);
};

const getUserId = async (ctx: ServerContext, email: string): Promise<number> => {
    const queryResponse = await postRequest(ctx, 'query', 'selectRows.api', {
        apiVersion: '17.1',
        schemaName: 'core',
        'query.columns': 'UserId,Email',
        'query.queryName': 'users',
        // User emails are lower-cased upon account creation
        'query.email~eq': email.toLowerCase(),
    }, { containerPath: '/' }).expect(successfulResponse);

    const { rows } = queryResponse.body;
    if (rows.length === 1) return rows[0].data.UserId.value;
    return undefined;
};

export const hookServer = (env: NodeJS.ProcessEnv): IntegrationTestServer => {
    // Override the global context path -- required for ActionURL to work
    LABKEY.contextPath = env.INTEGRATION_CONTEXT_PATH;

    const location = env.INTEGRATION_SERVER;

    const server: ServerContext = {
        agent: supertest(location),
        createdUsers: [],
        // This will be fully initialized after call to init()
        defaultContext: new RequestContext({
            password: env.INTEGRATION_AUTH_PASS,
            username: env.INTEGRATION_AUTH_USER,
        }),
        location,
    };

    return {
        addUserToRole: addUserToRole.bind(this, server),
        createRequestContext: createRequestContext.bind(this, server),
        createTestContainer: createTestContainer.bind(this, server),
        createUser: createUser.bind(this, server),
        get: getRequest.bind(this, server),
        init: init.bind(this, server),
        post: postRequest.bind(this, server),
        request: request.bind(this, server),
        teardown: teardown.bind(this, server),
    };
};

const init = async (ctx: ServerContext, projectName: string, containerOptions?: any): Promise<void> => {
    // Initialize the default request context
    ctx.defaultContext.csrfToken = await initCSRF(ctx);

    // Ensure project exists
    let project: Container;
    const getProjectResponse = await getRequest(
        ctx,
        'project',
        'getContainers.api',
        undefined,
        { containerPath: projectName }
    ).send();

    // project-getContainers.api returns HTML if the container DNE. Process against status codes directly.
    if (getProjectResponse.status !== 200) {
        if (getProjectResponse.status === 404) {
            try {
                project = await _createContainer(ctx, '/', projectName, containerOptions);
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

    ctx.projectPath = project.path;

    // Create default test container
    try {
        const testContainer = await createTestContainer(ctx);
        ctx.containerPath = testContainer.path;
    }
    catch (e) {
        throw new Error('Failed to initialize integration test. Unable to create test container.');
    }

    // Log useful information
    console.log('server:', ctx.location);
    console.log('container path:', ctx.containerPath);
};

const initCSRF = async (ctx: ServerContext): Promise<string> => {
    const MAX_RETRIES = 5;
    let lastResponse;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            let whoAmIResponse = await getRequest(ctx, 'login', 'whoAmI.api').send();

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

const postRequest = (
    ctx: ServerContext,
    controller: string,
    action: string,
    payload?: any,
    options?: RequestOptions
): Test => {
    return request(ctx, controller, action, (agent, url) => {
        return agent.post(url).send(payload).set('Content-Type', 'application/json');
    }, options);
};

const request = (
    ctx: ServerContext,
    controller: string,
    action: string,
    agentProvider: AgentProvider,
    options?: RequestOptions
): Test => {
    const requestContext = options?.requestContext ?? ctx.defaultContext;
    const { csrfToken, password, username } = requestContext;

    const url = ActionURL.buildURL(controller, action, options?.containerPath ?? ctx.containerPath);
    let request = agentProvider(ctx.agent, url).auth(username, password);

    if (csrfToken) {
        request = request.set('X-LABKEY-CSRF', csrfToken).set('Cookie', `X-LABKEY-CSRF=${csrfToken}`);
    }

    return request;
};

const setInitialPassword = async (ctx: ServerContext, user: CreateNewUser, password: string): Promise<void> => {
    // Only works for new users
    const { email, isNew, message } = user;
    if (isNew !== true) {
        throw new Error(`Failed to create user. Expected a new user to be created for account "${email}".`);
    }

    const tokenPrefix = 'setPassword.view?verification=';
    const tokenSuffix = '&amp;email=';

    if (message.indexOf(tokenPrefix) === -1 || message.indexOf(tokenSuffix) === -1) {
        throw new Error(`Failed to create user. Unexpected response message after creating account "${email}".`);
    }
    const verification = message.split(tokenPrefix)[1].split(tokenSuffix)[0];

    // Set the password (we're talking to HTML here...)
    await request(ctx, 'login', 'setPassword.view', (agent, url) => (
        agent.post(url)
            .field('email', email)
            .field('password', password)
            .field('password2', password)
            .field('verification', verification)
            .expect(302) // Expect to be redirected
    ), { containerPath: '/' });
}

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

const teardown = async (ctx: ServerContext): Promise<void> => {
    if (ctx.projectPath) {
        try {
            // Delete project created for this test run
            await postRequest(
                ctx,
                'core',
                'deleteContainer.api',
                undefined,
                {containerPath: ctx.projectPath}
            ).expect(successfulResponse);
        } catch (e) {
            throw new Error('Failed to teardown integration test. Unable to delete test project.');
        }
    }

    if (ctx.createdUsers.length > 0) {
        try {
            // Delete all users created during this test run
            await Promise.all(ctx.createdUsers.map(email => deleteUser(ctx, email)));
        }
        catch (e) {
            throw new Error('Failed to teardown integration test. Unable to delete test users.');
        }
    }
};
