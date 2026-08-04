/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { MutableRefObject, useCallback, useEffect, useRef } from 'react';
import { unstable_usePrompt as usePrompt } from 'react-router-dom';

export const CONFIRM_MESSAGE = 'You have unsaved changes that will be lost. Are you sure you want to continue?';

export type GetIsDirty = () => boolean;
export type SetIsDirty = (isDirty: boolean) => void;

export interface InjectedRouteLeaveProps {
    // getIsDirty is a function that returns a boolean because we use a ref to prevent this component from
    // re-rendering child components every time the dirty bit changes.
    getIsDirty: GetIsDirty;
    setIsDirty: SetIsDirty;
}

export interface WrappedRouteLeaveProps {
    confirmMessage?: string;
}

type GetSetIsDirty = [GetIsDirty, SetIsDirty];

/**
 * The dirty bit for every mounted useRouteLeave() consumer. Each consumer owns its own bit -- it can only ever set or
 * clear its own -- but navigation is blocked based on the aggregate, so unrelated consumers (e.g., a modal opened from a
 * dirty form) cannot mask one another. Unmounting a consumer removes only its own bit from the registry.
 */
const subscribers = new Set<MutableRefObject<boolean>>();

const isAnyDirty = (): boolean => {
    for (const subscriber of subscribers) {
        if (subscriber.current) return true;
    }
    return false;
};

const beforeUnload = (event: BeforeUnloadEvent): void => {
    if (isAnyDirty()) {
        event.returnValue = true;
    }
};

const subscribe = (isDirty: MutableRefObject<boolean>): (() => void) => {
    // BeforeUnload is needed so we can prevent the user from going to URLs outside our App.
    if (subscribers.size === 0) {
        window.addEventListener('beforeunload', beforeUnload);
    }
    subscribers.add(isDirty);

    // Unsubscribe
    return () => {
        subscribers.delete(isDirty);
        if (subscribers.size === 0) {
            window.removeEventListener('beforeunload', beforeUnload);
        }
    };
};

/**
 * The useRouteLeave hook is useful if you want to display a confirmation dialog when the user tries to navigate away
 * from a "dirty" form or page. This hook ties into both the React Router RouteLeave event and the browser beforeunload
 * event. This allows us to prevent navigation via back button, link clicking, or browser window/tab closing.
 *
 * Multiple, unrelated components may use this hook at the same time (e.g., a page and a modal rendered by that page).
 * Each consumer gets its own dirty bit, initialized from the dirty state of the consumers already mounted, and only
 * that bit is discarded when the consumer unmounts. Navigation is blocked whenever any consumer is dirty.
 *
 * @param confirmMessage The confirm message you want to display to the user, this message is only displayed when
 * navigating away from the page, not when closing the tab or browser window. Browsers do not let you customize the
 * message displayed when the browser/tab is closed. When multiple consumers are mounted, the message from the most
 * recently mounted consumer is used.
 */
export const useRouteLeave = (confirmMessage = CONFIRM_MESSAGE): GetSetIsDirty => {
    const isDirty = useRef<boolean>(false);
    const setIsDirty = useCallback<SetIsDirty>(dirty => {
        isDirty.current = dirty;
    }, []);
    const getIsDirty = useCallback<GetIsDirty>(() => isDirty.current, []);

    useEffect(() => {
        isDirty.current = isDirty.current || isAnyDirty();
        return subscribe(isDirty);
    }, []);

    // usePrompt prevents users from going to URLs within our App.
    usePrompt({ message: confirmMessage, when: isAnyDirty });

    return [getIsDirty, setIsDirty];
};
