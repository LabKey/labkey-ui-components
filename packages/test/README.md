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

[This test](./src/test/example.ispec.ts) is a working example of how integration tests could be written using `@labkey/test`.

### Configuration

Thus far, we've only configured `@labkey/test` within a Jest testing environment. The utilities are not dependent on
Jest, however, it may require additional changes to get it working with another test framework. This configuration
guide outlines the configurations that are available and how to get them working with Jest.

#### Jest Configuration

As of Jest 26.x you can specify the configuration options either directly in your `package.json` file or in a separate
configuration file. [Here is an example](./test/config/jest.config.integration.js) configuration that is used
by this package. Here are the properties you'll need to specify to get `@labkey/test` configured:

**setupFiles**

This property allows you to specify a list of setup files you'd like to run before initializing the test framework.
This package supplies an integration configuration that you can specify. This will configure all the properties
supported by `@labkey/test` (e.g. server metadata, user authentication, etc).

```json
"setupFiles": [
    "@labkey/test/dist/config/integration.setup.js"
],
```

**setupFilesAfterEnv (optional -- recommended)**

This property allows you to specify a list of configuration files that are to be run before each test file in the suite.
This package supplies a configuration you can load that will help ensure tests do not timeout before the
server is ready. In a test environment the server can sometimes take a moment to be fully ready. Due to this the
default Jest timeout can be adjusted on per test to provide for more stable test runs.

```json
"setupFilesAfterEnv": [
    "@labkey/test/dist/config/integration.setup.afterenv.js",
],
```

This configuration is not necessary for the tests to run, however, it is recommended if you're intending for
these tests to be run in a continuous integration environment.

**testRegex**

As a convention we specify our integration tests files by using the filename suffix `ispec`. This helps to distinguish
which tests are unit tests (normally `.spec`) from integration tests in our packages. To specify this you can add
this property in your integration test Jest configuration. Here is an example we use:

```json
"testRegex": "(\\.ispec)\\.(ts|tsx)$",
```

### Running

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
