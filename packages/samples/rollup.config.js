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
    // Could be utilized for named exports
    // 'immutable': [ 'fromJS', 'List', 'Map' ]
};

export default [
    {
        external: external,
        input: input,
        output: {
            file: 'dist/samples.cjs.js',
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
            file: 'dist/samples.es.js',
            format: 'es',
            name: 'samples'
        },
        plugins: [
            resolve(),
            commonjs({namedExports}),
            sass(),
            typescript()
        ]
    }
]
