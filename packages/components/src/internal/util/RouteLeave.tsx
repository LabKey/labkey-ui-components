import React, { ComponentType, FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { DeprecatedRouter } from '../routerTypes';
import { DeprecatedWithRouterProps, withRouterDeprecated } from '../withRouterDeprecated';

export const CONFIRM_MESSAGE = 'You have unsaved changes that will be lost. Are you sure you want to continue?';

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
 * from a "dirty" form or page. This hook ties into both the React Router RouteLeave event, and the browser beforeunload
 * event. This allows us to prevent navigation via back button, link clicking, or browser window/tab closing.
 * @param router: InjectedRouter from WithRouterProps
 * @param routes: PlainRoute[] from withRouterProps
 * @param confirmMessage: The confirm message you want to display to the user, this message is only displayed when
 * navigating away from the page, not when closing the tab or browser window. Browsers do not let you customize the
 * message displayed when the browser/tab is closed.
 */
// FIXME: use the appropriate RR6 APIs, do not merge until that is completed
export const useRouteLeave = (
    router?: DeprecatedRouter,
    routes?: any[],
    confirmMessage = CONFIRM_MESSAGE
): GetSetIsDirty => {
    const initialHistoryLength = useMemo(() => history.length, []);
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
                // we need to go back to the URL we were just at. Unfortunately going back to the URL we were just at
                // depends on what the user did, and detecting that is spotty at best. If the user clicked a link we
                // need to go back in history, if the user hit the back button we need to go forward in history. The
                // "best" way to detect this is by keeping track of the history length when we first render. If the user
                // clicked a link this will increase. This is method is unfortunately not perfect, but it prevents us
                // from showing the cancel dialog for every entry in the user's history until they either reach the
                // beginning of history, or hit leave page.
                //
                // You can still end up in a bad state in two known scenarios:
                // - if you alternate between using the back button, hitting cancel, clicking a link, hitting cancel
                // - If your browser history is at maximum length, this appears to be 50 in Chrome
                //
                // To avoid this entire situation we need to either commit to using Link components everywhere, which
                // don't cause the URL to change before onRouteLeave is called, or we need to upgrade to a newer version
                // of React Router.
                if (history.length > initialHistoryLength) {
                    // The user clicked a link
                    router.goBack();
                } else {
                    // The user hit the back button
                    router.goForward();
                }
                return false;
            }
        }

        return true;
    }, [isDirty, confirmMessage, initialHistoryLength]);

    const beforeUnload = useCallback(
        event => {
            if (isDirty.current === true) {
                event.returnValue = true;
            }
        },
        [isDirty]
    );

    useEffect(() => {
        const currentRoute = routes?.[routes.length - 1];
        // setRouteLeaveHook returns a cleanup function.
        return router?.setRouteLeaveHook(currentRoute, onRouteLeave);
    }, [onRouteLeave, router, routes]);

    useEffect(() => {
        window.addEventListener('beforeunload', beforeUnload);

        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [beforeUnload]);

    return [getIsDirty, setIsDirty];
};

export function withRouteLeave<T>(
    Component: ComponentType<T & InjectedRouteLeaveProps & DeprecatedWithRouterProps>
): ComponentType<T & WrappedRouteLeaveProps> {
    const wrapped: FC<T & WrappedRouteLeaveProps & DeprecatedWithRouterProps> = props => {
        const { router, confirmMessage } = props;
        const [getIsDirty, setIsDirty] = useRouteLeave(router, undefined, confirmMessage);

        return <Component getIsDirty={getIsDirty} setIsDirty={setIsDirty} {...props} />;
    };

    return withRouterDeprecated(wrapped) as FC<T & WrappedRouteLeaveProps>;
}

export interface WithDirtyCheckLinkProps {
    className?: string;
    leaveMsg?: string;
    onClick: () => void;
}

export const WithDirtyCheckLink: FC<WithDirtyCheckLinkProps & InjectedRouteLeaveProps> = props => {
    const { className, onClick, children, setIsDirty, getIsDirty, leaveMsg } = props;

    const handleOnClick = useCallback(() => {
        const dirty = getIsDirty();
        if (dirty) {
            const result = confirm(leaveMsg ?? CONFIRM_MESSAGE);
            if (!result) return;

            setIsDirty(false);
        }
        onClick();
    }, [setIsDirty, getIsDirty, onClick, leaveMsg]);

    return (
        <a className={className} onClick={handleOnClick}>
            {children}
        </a>
    );
};
