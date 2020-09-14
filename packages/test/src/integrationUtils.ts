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

interface CreateNewUser {
    email: string;
    isNew: boolean;
    message: string;
}

class RequestContext {
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
    initialized: boolean;
    location: string;
    projectPath?: string;
}

export interface RequestOptions {
    containerPath?: string;
    requestContext?: RequestContext;
}

export interface PostRequestOptions extends RequestOptions {
    postProcessor?: (postRequest: any, payload: any) => any;
}

export interface IntegrationTestServer {
    addUserToRole: (email: string, role: SecurityRole, containerPath?: string) => Promise<void>;
    createRequestContext: (config: Partial<RequestContext>) => Promise<RequestContext>;
    createTestContainer: (containerOptions?: any) => Promise<Container>;
    createUser: (email: string, password: string) => Promise<any>;
    get: (controller: string, action: string, params?: any, options?: RequestOptions) => Test;
    init: (lkProjectName: string, containerOptions?: any) => Promise<void>;
    post: (controller: string, action: string, payload?: any, options?: PostRequestOptions) => Test;
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

const createUser = async (ctx: ServerContext, email: string, password: string): Promise<any> => {
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
    const containerPath = options?.containerPath ?? ctx.containerPath;
    const url = ActionURL.buildURL(controller, action, containerPath, params);
    return withAuth(ctx, ctx.agent.get(url), options);
};

const getUserId = async (ctx: ServerContext, email: string): Promise<number> => {
    const queryResponse = await postRequest(ctx, 'query', 'selectRows.api', {
        apiVersion: '17.1',
        schemaName: 'core',
        'query.columns': 'UserId,Email',
        'query.queryName': 'users',
        'query.email~eq': email,
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
        initialized: false,
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

    ctx.initialized = true;

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
    options?: PostRequestOptions
): Test => {
    const containerPath = options?.containerPath ?? ctx.containerPath;
    let postRequest = ctx.agent.post(ActionURL.buildURL(controller, action, containerPath));

    if (options?.postProcessor) {
        postRequest = options.postProcessor(postRequest, payload);
    } else {
        postRequest = postRequest.send(payload).set('Content-Type', 'application/json');
    }

    return withAuth(ctx, postRequest, options);
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
    await postRequest(ctx, 'login', 'setPassword.view', undefined, {
        containerPath: '/',
        postProcessor: (request) => (
            request
                .field('email', email)
                .field('password', password)
                .field('password2', password)
                .field('verification', verification)
        ),
    }).expect(302); // Expect to be redirected
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
    if (ctx.initialized) {
        try {
            // Delete project created for this test run
            await postRequest(
                ctx,
                'core',
                'deleteContainer.api',
                undefined,
                { containerPath: ctx.projectPath }
            ).expect(successfulResponse);
        }
        catch (e) {
            throw new Error('Failed to teardown integration test. Unable to delete test project.');
        }

        try {
            // Delete all users created during this test run
            await Promise.all(ctx.createdUsers.map(email => deleteUser(ctx, email)));
        }
        catch (e) {
            throw new Error('Failed to teardown integration test. Unable to delete test users.');
        }
    }
};

const withAuth = (ctx: ServerContext, request: Test, options?: RequestOptions): Test => {
    const requestContext = options?.requestContext ?? ctx.defaultContext;
    const { csrfToken, password, username } = requestContext;

    request = request.auth(username, password);

    if (csrfToken) {
        request = request.set('X-LABKEY-CSRF', csrfToken).set('Cookie', `X-LABKEY-CSRF=${csrfToken}`);
    }

    return request;
};
