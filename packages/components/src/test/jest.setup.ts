/*
 * Copyright (c) 2018-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import '@testing-library/jest-dom'; // add custom jest matchers from jest-dom
import 'blob-polyfill';
import { enableMapSet, enablePatches } from 'immer';

// See Immer docs for why we do this: https://immerjs.github.io/immer/docs/installation#pick-your-immer-version
enableMapSet();
enablePatches();

// JSDom does not provide an implementation for scrollIntoView(). See https://github.com/jsdom/jsdom/issues/1695
Element.prototype.scrollIntoView = jest.fn();
Element.prototype.scrollTo = jest.fn();

// JSDom does not provide an implementation for CSS.supports().
Object.defineProperty(window, 'CSS', {
    value: { supports: jest.fn().mockReturnValue(true) },
});
