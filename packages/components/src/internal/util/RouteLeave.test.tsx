/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
// This package mocks react-router-dom (see __mocks__/react-router-dom.ts), which stubs out unstable_usePrompt. These
// tests exercise navigation blocking against a real router, so the mock is not used here.
jest.unmock('react-router-dom');

import React, { FC, useEffect, useState } from 'react';
import { act, render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { CONFIRM_MESSAGE, InjectedRouteLeaveProps, SetIsDirty, useRouteLeave } from './RouteLeave';

const OTHER_ROUTE = '/other';
const MODAL_MESSAGE = 'Modal confirm message';

class MockRequest {
    readonly method = 'GET';
    readonly signal: AbortSignal;
    readonly url: string;

    constructor(url: string, init: { signal: AbortSignal }) {
        this.signal = init.signal;
        this.url = url;
    }
}
// @ts-expect-error jsdom does not implement Request, which React Router instantiates whenever a navigation is allowed
// to complete.
global.Request = MockRequest as unknown as typeof Request;

type OnMount = (routeLeave: InjectedRouteLeaveProps) => void;

interface ConsumerProps {
    confirmMessage?: string;
    onMount: OnMount;
}

/**
 * Test consumer of useRouteLeave. The getIsDirty/setIsDirty pair is handed to the test on mount so that tests can drive
 * and inspect the dirty bit of an individual consumer.
 */
const Consumer: FC<ConsumerProps> = ({ confirmMessage, onMount }) => {
    const [getIsDirty, setIsDirty] = useRouteLeave(confirmMessage);

    useEffect(() => {
        onMount({ getIsDirty, setIsDirty });
    }, [getIsDirty, onMount, setIsDirty]);

    return null;
};

interface HarnessProps {
    onModalMount: OnMount;
    onPageMount: OnMount;
    onReady: (showModal: (show: boolean) => void) => void;
}

/**
 * Models a page that uses useRouteLeave and can mount a second, unrelated consumer (i.e., a modal) over itself.
 */
const Harness: FC<HarnessProps> = ({ onModalMount, onPageMount, onReady }) => {
    const [showModal, setShowModal] = useState<boolean>(false);

    useEffect(() => {
        onReady(setShowModal);
    }, [onReady]);

    return (
        <>
            <Consumer onMount={onPageMount} />
            {showModal && <Consumer confirmMessage={MODAL_MESSAGE} onMount={onModalMount} />}
        </>
    );
};

const renderHarness = () => {
    // Handles are populated as each consumer mounts. The modal handle is replaced every time the modal is re-shown.
    const modal = {} as InjectedRouteLeaveProps;
    const page = {} as InjectedRouteLeaveProps;
    let showModal: (show: boolean) => void;

    // A memory router is used instead of the apps' hash router because blocking is history-agnostic (the blocker lives
    // in the router itself) and initialEntries keeps each test isolated from the window.location left by the last one.
    const router = createMemoryRouter(
        [
            {
                element: (
                    <Harness
                        onModalMount={routeLeave => Object.assign(modal, routeLeave)}
                        onPageMount={routeLeave => Object.assign(page, routeLeave)}
                        onReady={setter => {
                            showModal = setter;
                        }}
                    />
                ),
                path: '/',
            },
            { element: null, path: OTHER_ROUTE },
        ],
        { initialEntries: ['/'] }
    );
    const rendered = render(<RouterProvider router={router} />);

    return {
        modal,
        page,
        router,
        setDirty: (handle: InjectedRouteLeaveProps, dirty: boolean) => act(() => handle.setIsDirty(dirty)),
        showModal: (show: boolean) => act(() => showModal(show)),
        unmount: rendered.unmount,
    };
};

const FirstPage: FC<ConsumerProps> = props => <Consumer {...props} />;
const SecondPage: FC<ConsumerProps> = props => <Consumer {...props} />;

const renderPages = () => {
    // Handles are populated as each page mounts.
    const first = {} as InjectedRouteLeaveProps;
    const second = {} as InjectedRouteLeaveProps;

    const router = createMemoryRouter(
        [
            { element: <FirstPage onMount={routeLeave => Object.assign(first, routeLeave)} />, path: '/' },
            { element: <SecondPage onMount={routeLeave => Object.assign(second, routeLeave)} />, path: OTHER_ROUTE },
        ],
        { initialEntries: ['/'] }
    );
    render(<RouterProvider router={router} />);

    return {
        first,
        router,
        second,
        setDirty: (handle: InjectedRouteLeaveProps, dirty: boolean) => act(() => handle.setIsDirty(dirty)),
    };
};

/**
 * Marks its parent's consumer dirty from its own mount effect. React runs child effects before parent effects, so this
 * fires before the parent consumer has had a chance to inherit.
 */
const DirtyOnMount: FC<{ setIsDirty: SetIsDirty }> = ({ setIsDirty }) => {
    useEffect(() => {
        setIsDirty(true);
    }, [setIsDirty]);

    return null;
};

const PageWithEagerChild: FC<ConsumerProps> = ({ onMount }) => {
    const [getIsDirty, setIsDirty] = useRouteLeave();

    useEffect(() => {
        onMount({ getIsDirty, setIsDirty });
    }, [getIsDirty, onMount, setIsDirty]);

    return <DirtyOnMount setIsDirty={setIsDirty} />;
};

// Attempt an in-app navigation, flushing the timeout usePrompt uses when the user confirms leaving.
const navigateAway = async (router: ReturnType<typeof createMemoryRouter>, route = OTHER_ROUTE): Promise<void> => {
    await act(() => router.navigate(route));
    await act(() => new Promise(resolve => setTimeout(resolve, 0)));
};

// A single beforeunload listener is expected to be shared by all consumers.
const getBeforeUnloadListener = (addEventListener: jest.SpyInstance): EventListener => {
    const calls = addEventListener.mock.calls.filter(([type]) => type === 'beforeunload');
    expect(calls).toHaveLength(1);
    return calls[0][1] as EventListener;
};

const fireBeforeUnload = (listener: EventListener): boolean | undefined => {
    const event = { returnValue: undefined };
    listener(event as unknown as Event);
    return event.returnValue;
};

describe('useRouteLeave', () => {
    let confirmSpy: jest.SpyInstance;

    beforeAll(() => {
        // React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7.
        // A router only supports one blocker at a time
        console.warn = jest.fn();
    });

    beforeEach(() => {
        // Deny navigation by default. The "leave anyway" case is asserted explicitly.
        confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('route blocking', () => {
        test('allows navigation when no consumer is dirty', async () => {
            const { router } = renderHarness();

            await navigateAway(router);

            expect(confirmSpy).not.toHaveBeenCalled();
            expect(router.state.location.pathname).toEqual(OTHER_ROUTE);
        });

        test('blocks navigation when a consumer is dirty', async () => {
            const { page, router, setDirty } = renderHarness();
            setDirty(page, true);

            await navigateAway(router);

            expect(confirmSpy).toHaveBeenCalledWith(CONFIRM_MESSAGE);
            expect(router.state.location.pathname).toEqual('/');
        });

        test('navigates when the user confirms leaving a dirty consumer', async () => {
            confirmSpy.mockReturnValue(true);
            const { page, router, setDirty } = renderHarness();
            setDirty(page, true);

            await navigateAway(router);

            expect(confirmSpy).toHaveBeenCalled();
            expect(router.state.location.pathname).toEqual(OTHER_ROUTE);
        });

        test('blocks navigation when a consumer other than the most recently mounted one is dirty', async () => {
            const { modal, page, router, setDirty, showModal } = renderHarness();
            setDirty(page, true);
            showModal(true);
            setDirty(modal, false);

            await navigateAway(router);

            expect(confirmSpy).toHaveBeenCalled();
            expect(router.state.location.pathname).toEqual('/');
        });

        test('stops blocking navigation once the dirty consumer unmounts', async () => {
            const { modal, router, setDirty, showModal } = renderHarness();
            showModal(true);
            setDirty(modal, true);

            await navigateAway(router);
            expect(confirmSpy).toHaveBeenCalled();
            expect(router.state.location.pathname).toEqual('/');

            confirmSpy.mockClear();
            showModal(false);
            await navigateAway(router);

            expect(confirmSpy).not.toHaveBeenCalled();
            expect(router.state.location.pathname).toEqual(OTHER_ROUTE);
        });

        test('displays the confirmMessage of the consumer holding the blocker', async () => {
            const { modal, router, setDirty, showModal } = renderHarness();
            showModal(true);
            setDirty(modal, true);

            await navigateAway(router);

            expect(confirmSpy).toHaveBeenCalledWith(MODAL_MESSAGE);
        });
    });

    describe('dirty bit ownership', () => {
        test('inherits the aggregate dirty state when mounted', () => {
            const { modal, page, setDirty, showModal } = renderHarness();

            showModal(true);
            expect(modal.getIsDirty()).toBe(false);
            showModal(false);

            setDirty(page, true);
            showModal(true);
            expect(modal.getIsDirty()).toBe(true);
        });

        test('setIsDirty only affects the calling consumer', () => {
            const { modal, page, setDirty, showModal } = renderHarness();
            setDirty(page, true);
            showModal(true);

            setDirty(modal, false);

            expect(modal.getIsDirty()).toBe(false);
            expect(page.getIsDirty()).toBe(true);
        });

        test('does not inherit from the consumer it replaces on a route change', async () => {
            // "Leave anyway" -- the outgoing page stays dirty right up until it unmounts.
            confirmSpy.mockReturnValue(true);
            const { first, router, second, setDirty } = renderPages();
            setDirty(first, true);

            await navigateAway(router);

            expect(confirmSpy).toHaveBeenCalledWith(CONFIRM_MESSAGE);
            expect(router.state.location.pathname).toEqual(OTHER_ROUTE);

            // The replacing page was never edited. Inheritance is resolved once the outgoing consumer has already
            // unsubscribed, so a consumer on its way out must not hand its dirty bit to the one taking its place.
            expect(second.getIsDirty()).toBe(false);

            // Leaving the replacing page must not prompt.
            confirmSpy.mockClear();
            await navigateAway(router, '/');

            expect(confirmSpy).not.toHaveBeenCalled();
            expect(router.state.location.pathname).toEqual('/');
        });

        test('keeps a dirty bit set by a descendant before the consumer inherits', () => {
            const page = {} as InjectedRouteLeaveProps;
            const router = createMemoryRouter(
                [
                    {
                        element: <PageWithEagerChild onMount={routeLeave => Object.assign(page, routeLeave)} />,
                        path: '/',
                    },
                ],
                { initialEntries: ['/'] }
            );
            render(<RouterProvider router={router} />);

            // Inheriting must never clear a bit, only set one: the descendant's setIsDirty(true) ran first.
            expect(page.getIsDirty()).toBe(true);
        });

        test('discards only its own dirty bit when unmounting', async () => {
            const addEventListener = jest.spyOn(window, 'addEventListener');
            const { modal, page, router, setDirty, showModal } = renderHarness();
            setDirty(page, true);
            showModal(true);
            setDirty(modal, true);

            showModal(false);

            expect(page.getIsDirty()).toBe(true);
            expect(fireBeforeUnload(getBeforeUnloadListener(addEventListener))).toBe(true);
            await navigateAway(router);
            expect(router.state.location.pathname).toEqual('/');
        });
    });

    describe('beforeunload', () => {
        test('warns when any consumer is dirty', () => {
            const addEventListener = jest.spyOn(window, 'addEventListener');
            const { modal, setDirty, showModal } = renderHarness();
            showModal(true);

            const listener = getBeforeUnloadListener(addEventListener);
            expect(fireBeforeUnload(listener)).toBeUndefined();

            setDirty(modal, true);
            expect(fireBeforeUnload(listener)).toBe(true);

            setDirty(modal, false);
            expect(fireBeforeUnload(listener)).toBeUndefined();
        });

        test('removes the listener only after the last consumer unmounts', () => {
            const addEventListener = jest.spyOn(window, 'addEventListener');
            const removeEventListener = jest.spyOn(window, 'removeEventListener');
            const { showModal, unmount } = renderHarness();
            showModal(true);
            const listener = getBeforeUnloadListener(addEventListener);

            showModal(false);
            expect(removeEventListener).not.toHaveBeenCalledWith('beforeunload', listener);

            unmount();
            expect(removeEventListener).toHaveBeenCalledWith('beforeunload', listener);
        });
    });
});
