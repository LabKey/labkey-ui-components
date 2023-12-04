import React, { useCallback, useEffect, useState } from 'react';
import { unstable_usePrompt as usePrompt } from 'react-router-dom';

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
 * @param confirmMessage: The confirm message you want to display to the user, this message is only displayed when
 * navigating away from the page, not when closing the tab or browser window. Browsers do not let you customize the
 * message displayed when the browser/tab is closed.
 */
export const useRouteLeave = (confirmMessage = CONFIRM_MESSAGE): GetSetIsDirty => {
    const [isDirty, setIsDirty] = useState<boolean>(false);

    // TODO: getIsDirty is an artifact of the react-router 3 version of this component. We should update this hook to
    //  return isDirty directly. Putting this off for now to limit the scope of the changes during the RR upgrade.
    const getIsDirty = useCallback((): boolean => isDirty, [isDirty]);

    // usePrompt prevents users from going to URLs within our App
    usePrompt({ when: isDirty, message: confirmMessage });

    // BeforeUnload is needed so we can prevent the user from going to URLs outside our App (e.g. to FM or LKS)
    const beforeUnload = useCallback(
        event => {
            if (isDirty === true) {
                event.returnValue = true;
            }
        },
        [isDirty]
    );

    useEffect(() => {
        window.addEventListener('beforeunload', beforeUnload);

        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [beforeUnload]);

    return [getIsDirty, setIsDirty];
};
