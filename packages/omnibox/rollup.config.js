import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

const globals = {
    'classnames': 'classNames',
    'jquery': 'jQuery',
    'react': 'React',
    'react-dom': 'ReactDOM',
    'react-input-autosize': 'AutosizeInput'
};
const external = Object.keys(globals);

export default [
    {
        external: external,
        input: 'src/OmniBox.tsx',
        output: {
            file: 'dist/omnibox.cjs.js',
            format: 'cjs'
        },
        plugins: [
            resolve(),
            commonjs({
                namedExports: {
                    'jquery': [ '$' ]
                }
            }),
            typescript()
        ]
    },
    {
        external: external,
        input: 'src/OmniBox.tsx',
        output: {
            file: 'dist/omnibox.es.js',
            format: 'es',
            name: 'omnibox'
        },
        plugins: [
            resolve(),
            commonjs({
                namedExports: {
                    'jquery': [ '$' ]
                }
            }),
            typescript()
        ]
    },
    {
        external: external,
        input: 'src/OmniBox.tsx',
        output: {
            file: 'dist/omnibox.umd.js',
            format: 'umd',
            name: 'omnibox',
            globals: globals
        },
        plugins: [
            resolve(),
            commonjs({
                namedExports: {
                    'jquery': [ '$' ]
                }
            }),
            typescript()
        ]
    }
]