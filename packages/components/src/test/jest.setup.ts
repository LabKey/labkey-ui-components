import '@testing-library/jest-dom'; // add custom jest matchers from jest-dom
import 'blob-polyfill';
import { enableMapSet, enablePatches } from 'immer';

// See Immer docs for why we do this: https://immerjs.github.io/immer/docs/installation#pick-your-immer-version
enableMapSet();
enablePatches();

// JSDom does not provide an implementation for scrollIntoView(). See https://github.com/jsdom/jsdom/issues/1695
Element.prototype.scrollIntoView = jest.fn();

// JSDom does not provide an implementation for CSS.supports().
Object.defineProperty(window, 'CSS', {
    value: { supports: jest.fn().mockReturnValue(true) },
});
