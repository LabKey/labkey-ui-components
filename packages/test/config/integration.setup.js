/*
 * Copyright (c) 2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
var fs = require('fs');
var propertiesReader = require('properties-reader');
const netrc = require('./netrc');

// Defaults are configured for a local development environment
const DEFAULT_CONTEXT_PATH = '/';
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

    // Apply TeamCity build properties, if present
    if (propFile) {
        if (fs.existsSync(propFile)) {
            const properties = propertiesReader(propFile);

            const serverPropName = 'labkey.server';
            const propServer = properties.get(serverPropName);
            if (propServer) {
                const serverParts = propServer.split('://');

                if (serverParts.length !== 2) {
                    throw new Error(`Expected test property "${serverPropName}" to be formatted with protocol (e.g. http://localhost). Received "${propServer}".`);
                }

                props.protocol = serverParts[0];
                props.server = serverParts[1];
            }

            const propContextPath = properties.get('labkey.contextpath');
            if (propContextPath) {
                props.contextPath = propContextPath;
            }

            let propPort = properties.get('labkey.port');
            if (!propPort) {
                propPort = properties.get('tomcat.port') // Property from TeamCity build agents
            }
            if (propPort) {
                props.port = propPort;
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
