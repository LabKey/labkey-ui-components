/*
 * Copyright (c) 2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import sass from "rollup-plugin-sass";

const input = 'src/index.ts';

const globals = {
    'immutable': 'immutable',
    'react': 'React',
    'react-dom': 'ReactDOM'
};
const external = Object.keys(globals);

const namedExports = {
    // Could be utilized for named exports
    // 'immutable': [ 'fromJS', 'List', 'Map' ]
    '../../node_modules/react-redux/node_modules/react-is/index.js': ['isValidElementType', 'isContextConsumer']
};

const include = [
    /node_modules/
]

export default [
    {
        external: external,
        input: input,
        output: {
            file: 'dist/domainproperties.cjs.js',
            format: 'cjs'
        },
        plugins: [
            resolve(),
            commonjs({namedExports, include}),
            typescript(),
            sass({
                output: 'dist/domainproperties.css'
            })
        ]
    },
    {
        external: external,
        input: input,
        output: {
            file: 'dist/domainproperties.es.js',
            format: 'es',
            name: 'domainproperties'
        },
        plugins: [
            resolve(),
            commonjs({namedExports, include}),
            typescript(),
            sass()
        ]
    },
    {
        external: external,
        input: input,
        output: {
            file: 'dist/domainproperties.umd.js',
            format: 'umd',
            name: 'domainproperties',
            globals: globals
        },
        plugins: [
            resolve(),
            commonjs({namedExports, include}),
            typescript(),
            sass()
        ]
    }
]