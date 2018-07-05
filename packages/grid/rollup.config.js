import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

const globals = {
    'classnames': 'classNames',
    'react': 'React',
    'react-dom': 'ReactDOM'
};
const external = Object.keys(globals);

const namedExports = {
    'immutable': [ 'fromJS', 'List', 'Map' ]
};

export default [
    {
        external: external,
        input: 'src/Grid.tsx',
        output: {
            file: 'dist/grid.cjs.js',
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
        input: 'src/Grid.tsx',
        output: {
            file: 'dist/grid.es.js',
            format: 'es',
            name: 'grid'
        },
        plugins: [
            resolve(),
            commonjs({namedExports}),
            typescript()
        ]
    },
    {
        external: external,
        input: 'src/Grid.tsx',
        output: {
            file: 'dist/grid.umd.js',
            format: 'umd',
            name: 'grid',
            globals: globals
        },
        plugins: [
            resolve(),
            commonjs({namedExports}),
            typescript()
        ]
    }
]