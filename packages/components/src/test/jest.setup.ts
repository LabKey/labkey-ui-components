import '@testing-library/jest-dom'; // add custom jest matchers from jest-dom
require('blob-polyfill');
import { enableMapSet, enablePatches } from 'immer';

// See Immer docs for why we do this: https://immerjs.github.io/immer/docs/installation#pick-your-immer-version
enableMapSet();
enablePatches();
