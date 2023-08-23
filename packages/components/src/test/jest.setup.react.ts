import '@testing-library/jest-dom'; // add custom jest matchers from jest-dom
require('blob-polyfill');

Object.defineProperty(window, '__react-beautiful-dnd-disable-dev-warnings', { value: true, writable: false });
