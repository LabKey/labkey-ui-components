/*
 * Copyright (c) 2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import sass from "rollup-plugin-sass";
import typescript from 'rollup-plugin-typescript2';

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
    'prop-types': ['array', 'arrayOf', 'bool', 'element', 'func', 'object', 'shape', 'string', 'oneOfType']
};

export default [
    {
        external: external,
        input: input,
        output: {
            file: 'dist/querygrid.cjs.js',
            format: 'cjs'
        },
        plugins: [
            resolve(),
            commonjs({namedExports}),
            typescript(),
            sass({
                output: 'dist/querygrid.css'
            })
        ]
    },
    {
        external: external,
        input: input,
        output: {
            file: 'dist/querygrid.es.js',
            format: 'es',
            name: 'querygrid'
        },
        plugins: [
            resolve(),
            commonjs({namedExports}),
            typescript(),
            sass()
        ]
    }
]