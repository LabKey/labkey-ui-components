/*
 * Copyright (c) 2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

const input = 'src/QueryGrid.tsx';

const globals = {
    'immutable': 'immutable',
    'react': 'React',
    'react-dom': 'ReactDOM'
};
const external = Object.keys(globals);

const namedExports = {
    // Could be utilized for named exports
    // 'immutable': [ 'fromJS', 'List', 'Map' ]
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
            typescript()
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
            typescript()
        ]
    },
    {
        external: external,
        input: input,
        output: {
            file: 'dist/querygrid.umd.js',
            format: 'umd',
            name: 'querygrid',
            globals: globals
        },
        plugins: [
            resolve(),
            commonjs({namedExports}),
            typescript()
        ]
    }
]