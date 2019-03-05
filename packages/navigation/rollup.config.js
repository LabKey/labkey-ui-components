/*
 * Copyright (c) 2018 LabKey Corporation
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

const cjsOptions = {
    namedExports: {
        'jquery': [ '$' ]
    }
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
            commonjs(cjsOptions),
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
            commonjs(cjsOptions),
            typescript(),
            sass()
        ]
    },
    {
        external,
        input,
        output: {
            file: 'dist/navigation.umd.js',
            format: 'umd',
            name: 'navigation',
            globals
        },
        plugins: [
            resolve(),
            commonjs(cjsOptions),
            typescript(),
            sass()
        ]
    }
]
