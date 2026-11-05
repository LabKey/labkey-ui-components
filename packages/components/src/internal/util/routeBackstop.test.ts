/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
// The react-router mock (see __mocks__/react-router.ts) has no data router; these tests navigate a real one
jest.unmock('react-router');
jest.mock('@labkey/api', () => {
    const actual = jest.requireActual('@labkey/api');
    return { ...actual, Ajax: { ...actual.Ajax, getCancellableRequests: jest.fn() } };
});

import { Ajax } from '@labkey/api';
import { createMemoryRouter, DataRouter } from 'react-router';

import { installRouteBackstop } from './routeBackstop';

class MockRequest {
    readonly method = 'GET';
    readonly signal: AbortSignal;
    readonly url: string;

    constructor(url: string, init: { signal: AbortSignal }) {
        this.signal = init.signal;
        this.url = url;
    }
}
// @ts-expect-error jsdom does not implement Request, which React Router instantiates for each navigation
global.Request = MockRequest as unknown as typeof Request;

const mockXhr = (): XMLHttpRequest => ({ abort: jest.fn() }) as unknown as XMLHttpRequest;

describe('installRouteBackstop', () => {
    let inFlight: XMLHttpRequest[];
    let router: DataRouter;
    let uninstall: () => void;

    beforeEach(() => {
        jest.useFakeTimers();
        inFlight = [];
        jest.mocked(Ajax.getCancellableRequests).mockImplementation(() => [...inFlight]);
        router = createMemoryRouter(
            [
                { path: '/samples', element: null },
                { path: '/samples/:sampleType', element: null },
                { path: '/plates/*', element: null },
            ],
            { initialEntries: ['/samples'] }
        );
        uninstall = installRouteBackstop(router);
    });

    afterEach(() => {
        uninstall();
        router.dispose();
        jest.useRealTimers();
    });

    test('aborts in-flight requests after the route changes', async () => {
        const xhr = mockXhr();
        inFlight.push(xhr);

        await router.navigate('/samples/blood');
        expect(xhr.abort).not.toHaveBeenCalled();

        jest.runAllTimers();
        expect(xhr.abort).toHaveBeenCalledTimes(1);
    });

    test('ignores query-string-only changes', async () => {
        const xhr = mockXhr();
        inFlight.push(xhr);

        await router.navigate('/samples?view=grid');
        jest.runAllTimers();
        expect(xhr.abort).not.toHaveBeenCalled();
    });

    test('ignores param-only changes', async () => {
        await router.navigate('/samples/blood');
        jest.runAllTimers();

        const xhr = mockXhr();
        inFlight.push(xhr);
        await router.navigate('/samples/plasma');
        jest.runAllTimers();
        expect(xhr.abort).not.toHaveBeenCalled();
    });

    test('treats a splat section as one page', async () => {
        await router.navigate('/plates/1');
        jest.runAllTimers();

        const xhr = mockXhr();
        inFlight.push(xhr);
        await router.navigate('/plates/1/2');
        await router.navigate('/plates/1/');
        jest.runAllTimers();
        expect(xhr.abort).not.toHaveBeenCalled();

        await router.navigate('/samples');
        jest.runAllTimers();
        expect(xhr.abort).toHaveBeenCalledTimes(1);
    });

    test('leaves requests started after the route change alone', async () => {
        const old = mockXhr();
        inFlight.push(old);

        await router.navigate('/samples/blood');
        const next = mockXhr();
        inFlight.push(next);

        jest.runAllTimers();
        expect(old.abort).toHaveBeenCalledTimes(1);
        expect(next.abort).not.toHaveBeenCalled();
    });

    test('compares against the latest page', async () => {
        await router.navigate('/samples/blood');
        jest.runAllTimers();

        const xhr = mockXhr();
        inFlight.push(xhr);
        await router.navigate('/samples/blood?view=grid');
        jest.runAllTimers();
        expect(xhr.abort).not.toHaveBeenCalled();

        await router.navigate('/samples');
        jest.runAllTimers();
        expect(xhr.abort).toHaveBeenCalledTimes(1);
    });

    test('does nothing once removed', async () => {
        const xhr = mockXhr();
        inFlight.push(xhr);
        uninstall();

        await router.navigate('/samples/blood');
        jest.runAllTimers();
        expect(xhr.abort).not.toHaveBeenCalled();
    });
});
