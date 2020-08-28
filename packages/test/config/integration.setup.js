/*
 * Copyright (c) 2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
var fs = require('fs');
var propertiesReader = require('properties-reader');
const netrc = require('./netrc');

// Defaults are configured for a local development environment
const DEFAULT_CONTEXT_PATH = '/labkey';
const DEFAULT_SERVER = 'localhost';
const DEFAULT_SERVER_PROTOCOL = 'http';
const DEFAULT_PORT = 8080;

const {
    npm_config_contextpath,
    npm_config_pass,
    npm_config_port,
    npm_config_protocol,
    npm_config_server,
    npm_config_username,
} = process.env;

function getNetRC(machineName) {
    const netrcFile = netrc();
    const auth = netrcFile[machineName];

    if (!auth) {
        throw new Error(`Unable to locate authentication for machine "${machineName}" in ${netrc.getNetrcFileName()}.`);
    }

    return auth;
}

function getTestProperties() {
    let props = {
        contextPath: DEFAULT_CONTEXT_PATH,
        port: DEFAULT_PORT,
        protocol: DEFAULT_SERVER_PROTOCOL,
        server: DEFAULT_SERVER,
    };

    const propFile = process.env.TEAMCITY_BUILD_PROPERTIES_FILE;

    // Apply properties from test.properties
    if (propFile) {
        if (fs.existsSync(propFile)) {
            const properties = propertiesReader(propFile);

            const serverPropName = 'labkey.server';
            const propServer = properties.get(serverPropName);
            const serverParts = propServer.split('://');

            if (serverParts.length !== 2) {
                throw new Error(`Expected test property "${serverPropName}" to be formatted with protocol (e.g. http://server). Received "${propServer}".`);
            }

            // Defaults not applied if test.properties present
            props = {
                contextPath: properties.get('labkey.contextpath'),
                port: properties.get('labkey.port'),
                protocol: serverParts[0],
                server: serverParts[1],
            }
        } else {
            throw new Error(`Unable to locate test properties file at path "${propFile}".`);
        }
    }

    // Apply properties from CLI
    if (npm_config_contextpath !== undefined) {
        props.contextPath = npm_config_contextpath;
    }

    if (npm_config_port !== undefined) {
        props.port = parseInt(npm_config_port, 10);
    }

    if (npm_config_protocol !== undefined) {
        props.protocol = npm_config_protocol;
    }

    if (npm_config_server !== undefined) {
        props.server = npm_config_server;
    }

    // Validate properties
    if (isNaN(props.port)) {
        throw new Error(`Invalid port. Unable to parse "${props.port}". Port must be a number.`);
    }

    return props;
}

// Configure server properties
const { contextPath, port, protocol, server } = getTestProperties();

// Configure authentication
let user;
let pass;

if (npm_config_username || npm_config_pass) {
    // require both be supplied
    user = npm_config_username;
    pass = npm_config_pass;

    if (!user || !pass) {
        throw new Error('Unable to determine authentication properties. Must supply both "--username" and "--pass".');
    }
} else {
    const { login, password } = getNetRC(server);
    user = login;
    pass = password;

    if (!user || !pass) {
        throw new Error(`Unable to determine authentication properties via ${netrc.getNetrcFileName()}.`);
    }
}

process.env.INTEGRATION_SERVER = `${protocol}://${server}:${port}`;
process.env.INTEGRATION_CONTEXT_PATH = contextPath;
process.env.INTEGRATION_AUTH_USER = user;
process.env.INTEGRATION_AUTH_PASS = pass;
