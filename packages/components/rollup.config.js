/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import sass from "rollup-plugin-sass";
import copy from 'rollup-plugin-copy';
import json from 'rollup-plugin-json';

const input = 'src/index.ts';

const globals = {
    'immutable': 'immutable',
    'react': 'React',
    'react-dom': 'ReactDOM'
};
const external = Object.keys(globals);

const namedExports = {
    // Named exports for packages
    // (when you get an error like: Error: 'getGlobal' is not exported by ../../node_modules/reactn/index.js)
    'reactn': ['getGlobal', 'setGlobal'],
    // this is required to avoid errors such as this:  Error: 'arrayOf' is not exported by ../../node_modules/react-router/node_modules/prop-types/index.js
    'react-router/node_modules/prop-types/index.js': ['array', 'arrayOf', 'bool', 'element', 'func', 'object', 'shape', 'string', 'oneOfType'],
    'prop-types': ['array', 'arrayOf', 'bool', 'element', 'func', 'object', 'shape', 'string', 'oneOfType'],
    // Error: 'DataSet' is not exported by ../../node_modules/vis/dist/vis.js
    'vis': ['DataSet', 'Network'],
    // Error: 'isValidElementType' is not exported by ../../node_modules/react-redux/node_modules/react-is/index.js
    'node_modules/react-is/index.js': ['isValidElementType', 'isContextConsumer']
};

export default [
    {
        external: external,
        input: input,
        output: {
            file: 'dist/components.es.js',
            format: 'es',
            name: 'components'
        },
        plugins: [
            resolve(),
            commonjs({namedExports}),
            typescript({
                objectHashIgnoreUnknownHack: true,
                clean: true
            }),
            sass({
                output: 'dist/components.css'
            }),
            copy({
                targets: {
                    'src/typings/react-bootstrap.d.ts': 'dist/typings/react-bootstrap.d.ts'
                }
            }),
            json()
        ]
    }
]
