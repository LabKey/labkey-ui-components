/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import sass from 'rollup-plugin-sass';
import typescript from 'rollup-plugin-typescript2';

const globals = {
    'classnames': 'classNames',
    'immutable': 'immutable',
    'jquery': 'jQuery',
    'react': 'React',
    'react-dom': 'ReactDOM',
    'react-input-autosize': 'AutosizeInput'
};
const external = Object.keys(globals);

const input = 'src/index.ts';

const namedExports = {
    'jquery': [ '$' ],
    // Named exports for packages
    // (when you get an error like: Error: 'getGlobal' is not exported by ../../node_modules/reactn/index.js)
    'reactn': ['getGlobal', 'setGlobal'],
    // this is required to avoid errors such as this:  Error: 'arrayOf' is not exported by ../../node_modules/react-router/node_modules/prop-types/index.js
    'react-router/node_modules/prop-types/index.js': ['array', 'arrayOf', 'bool', 'element', 'func', 'object', 'shape', 'string', 'oneOfType'],
    'prop-types': ['array', 'arrayOf', 'bool', 'element', 'func', 'object', 'shape', 'string', 'oneOfType']
};

export default [
    {
        external,
        input,
        output: {
            file: 'dist/navigation.cjs.js',
            format: 'cjs'
        },
        plugins: [
            resolve(),
            commonjs({namedExports}),
            typescript(),
            sass({
                output: 'dist/navigation.css'
            })
        ]
    },
    {
        external,
        input,
        output: {
            file: 'dist/navigation.es.js',
            format: 'es',
            name: 'navigation'
        },
        plugins: [
            resolve(),
            commonjs({namedExports}),
            typescript(),
            sass()
        ]
    }
]
