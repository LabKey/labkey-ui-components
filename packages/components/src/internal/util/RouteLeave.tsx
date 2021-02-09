import React, { ComponentType, FC, useCallback, useEffect, useRef } from 'react';
import { InjectedRouter, withRouter, WithRouterProps, PlainRoute } from 'react-router';

export const CONFIRM_MESSAGE = 'You have unsaved changes that will be lost. Are you sure you want to continue?';

/**
 * @deprecated: use useRouteLeave or withRouteLeave instead
 * This function can be used as the callback for react-router's setRouteLeaveHook.  It should be preferred
 * over a callback that simply returns the confirm message because with react-router v3.x, the URL route
 * will have already been changed by the time this confirm is shown and will not be reset if the user does not confirm.
 * If the user tries to click on the initial link again after canceling, nothing will happen because the URL
 * in the browser will not change. (Issue 39633).
 * See also https://stackoverflow.com/questions/32841757/detecting-user-leaving-page-with-react-router
 *
 * TODO: Seems like there are some additional tools in newer versions of react-router:
 *  https://stackoverflow.com/questions/62792342/in-react-router-v6-how-to-check-form-is-dirty-before-leaving-page-route
 */
export function confirmLeaveWhenDirty(): boolean {
    const result = confirm(CONFIRM_MESSAGE);

    if (!result) {
        // Issue 42101: the browser changes the URL before onRouteLeave is called, so if the user cancels
        // we need to go back to the URL we were just at.
        window.history.forward();
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
                // we need to go back to the URL we were just at.
                router.goForward();
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
