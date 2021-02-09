import React, { ComponentType, FC, useCallback, useEffect, useRef } from 'react';
import { InjectedRouter, withRouter, WithRouterProps, PlainRoute } from 'react-router';

export const CONFIRM_MESSAGE = 'You have unsaved changes that will be lost. Are you sure you want to continue?';

/**
 * @deprecated: use useRouteLeave or withRouteLeave instead
 * This function can be used as the callback for react-router's setRouteLeaveHook. See notes in useRouteLeave re: Issue
 * 42101 in order to understand the caveats that come with using this function.
 */
export function confirmLeaveWhenDirty(): boolean {
    const result = confirm(CONFIRM_MESSAGE);

    if (!result) {
        window.history.back();
    }

    return result;
}

export interface InjectedRouteLeaveProps {
    // getIsDirty is a function that returns a boolean because we use a ref in order to prevent this component from
    // re-rendering child components every time the dirty bit changes.
    getIsDirty: () => boolean;
    setIsDirty: (isDirty: boolean) => void;
}

export interface WrappedRouteLeaveProps {
    confirmMessage?: string;
}

type GetSetIsDirty = [() => boolean, (dirty: boolean) => void];

/**
 * The useRouteLeave hook is useful if you want to display a confirmation dialog when the user tries to navigate away
 * from a "dirty" form or page. The router and routes props come from the WithRouterProps interface, confirmMessage
 * @param router: InjectedRouter from WithRouterProps
 * @param routes: PlainRoute[] from withRouterProps
 * @param confirmMessage: The confirm message you want to display to the user, this message is only displayed when
 * navigating away from the page, not when closing the tab or browser window. Browsers do not let you customize the
 * message displayed when the browser/tab is closed.
 */
export const useRouteLeave = (
    router: InjectedRouter,
    routes: PlainRoute[],
    confirmMessage = CONFIRM_MESSAGE
): GetSetIsDirty => {
    const isDirty = useRef<boolean>(false);

    const setIsDirty = useCallback(
        (dirty: boolean) => {
            isDirty.current = dirty;
        },
        [isDirty]
    );

    const getIsDirty = useCallback((): boolean => {
        return isDirty.current;
    }, [isDirty]);

    const onRouteLeave = useCallback(() => {
        if (isDirty.current === true) {
            const result = confirm(confirmMessage);

            if (!result) {
                // Issue 42101: the browser changes the URL before onRouteLeave is called, so if the user cancels
                // we need to go back to the URL we were just at. However we cannot at the time determine if the
                // user clicked a link or hit the back button. If the user clicks a link the browser adds to history
                // and the appropriate action is to go back. If the user hits the back button, the appropriate
                // action is to go forward. Unfortunately since we have no way of knowing what the user just did we
                // have to choose between breaking all links, or breaking the back button. We chose to break the back
                // button. The solution appears to be either convert all anchor tags to Link components, or to upgrade
                // React Router to 4 or beyond.
                router.goBack();
                return false;
            }
        }

        return true;
    }, [isDirty, confirmMessage]);

    const beforeUnload = useCallback(
        event => {
            if (isDirty.current === true) {
                event.returnValue = true;
            }
        },
        [isDirty]
    );

    useEffect(() => {
        const currentRoute = routes[routes.length - 1];
        // setRouteLeaveHook returns a cleanup function.
        return router.setRouteLeaveHook(currentRoute, onRouteLeave);
    }, [onRouteLeave]);

    useEffect(() => {
        window.addEventListener('beforeunload', beforeUnload);

        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [beforeUnload]);

    return [getIsDirty, setIsDirty];
};

export function withRouteLeave<T>(
    Component: ComponentType<T & InjectedRouteLeaveProps>
): ComponentType<T & WrappedRouteLeaveProps> {
    const wrapped: FC<T & WrappedRouteLeaveProps & WithRouterProps> = props => {
        const { router, routes, confirmMessage, ...rest } = props;
        const [getIsDirty, setIsDirty] = useRouteLeave(router, routes, confirmMessage);

        return <Component getIsDirty={getIsDirty} setIsDirty={setIsDirty} {...(rest as T)} />;
    };

    return withRouter(wrapped) as FC<T & WrappedRouteLeaveProps>;
}
