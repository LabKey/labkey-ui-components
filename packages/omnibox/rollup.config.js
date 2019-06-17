/*
 * Copyright (c) 2018-2019 LabKey Corporation
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
    'jquery': [ '$' ]
};

export default [
    {
        external,
        input,
        output: {
            file: 'dist/omnibox.cjs.js',
            format: 'cjs'
        },
        plugins: [
            resolve(),
            commonjs({namedExports}),
            typescript(),
            sass({
                output: 'dist/omnibox.css'
            })
        ]
    },
    {
        external,
        input,
        output: {
            file: 'dist/omnibox.es.js',
            format: 'es',
            name: 'omnibox'
        },
        plugins: [
            resolve(),
            commonjs({namedExports}),
            typescript(),
            sass()
        ]
    }
]