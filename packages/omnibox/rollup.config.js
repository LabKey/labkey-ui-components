import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import sass from 'rollup-plugin-sass';
import typescript from 'rollup-plugin-typescript2';

const globals = {
    'classnames': 'classNames',
    'jquery': 'jQuery',
    'react': 'React',
    'react-dom': 'ReactDOM',
    'react-input-autosize': 'AutosizeInput'
};
const external = Object.keys(globals);

const input = 'src/OmniBox.tsx';

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
            file: 'dist/omnibox.cjs.js',
            format: 'cjs'
        },
        plugins: [
            resolve(),
            commonjs(cjsOptions),
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
            commonjs(cjsOptions),
            typescript(),
            sass()
        ]
    },
    {
        external,
        input,
        output: {
            file: 'dist/omnibox.umd.js',
            format: 'umd',
            name: 'omnibox',
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