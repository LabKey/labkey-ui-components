# @labkey/test

This package contains utilities and configurations for running JavaScript tests.

## Installation

```sh
# Using npm
npm install @labkey/test --save-dev

# Using yarn
yarn add @labkey/test --dev
```

## Integration Tests

Endpoint integration tests allow for the stateful testing of endpoints as they are called by a client.
This package provides a set of utilities that can be used in conjunction with a test framework to directly test
endpoints on a LabKey server. This includes:

* Creation and teardown of a test project (container) on the target server.
* Creation of a unique test container in which the tests are run.
* User authentication and acquiring of CSRF token for POST requests.

### Examples

The following is an example of how integration tests could be written using `@labkey/test`.

```ts
import { hookServer } from '@labkey/test';

// Declare the name of the LabKey project for these tests.
const PROJECT_NAME = 'MyIntegrationTestProject';

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
        const response = await server.post('query', 'selectRows.api', { schemaName: 'core' }).expect(404);

        // Assert
        const { exception } = response.body;
        expect(exception).toEqual('Query not specified');
    });
});
```

## Configuration

TODO

## Running

If you're utilizing the configurations supplied by `@labkey/test` you can specify the following properties
either by command line or in a configuration file:

|Command|Property File|Default Value|Description|
|-------|-------------|-------|-----------|
|`--contextpath`|`labkey.contextpath`|`/labkey`|The server's context path|
|`--pass`|N/A|`(empty)`|User authentication password (not recommended -- specify via netrc if possible)|
|`--port`|`labkey.port`|`8080`|Port for server requests|
|`--protocol`|`labkey.server`|`http`|The wire protocol for server requests. Only `http` and `https` are supported.|
|`--server`|`labkey.server`|`localhost`|The server domain name|
|`--username`|N/A|`(empty)`|User authentication name (not recommended -- specify via netrc if possible)|

To use a configuration file set the environmental variable `TEAMCITY_BUILD_PROPERTIES_FILE` to the path of your
configuration file.

## Release Notes
Release notes for this package are available [here](../components/releaseNotes/labkey/test.md).
