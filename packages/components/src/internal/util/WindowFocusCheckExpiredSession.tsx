import React, { ComponentType, FC, useEffect } from 'react';

import { useServerContext } from '../components/base/ServerContext';

const useWindowFocusCheckExpiredSession = (): void => {
    const { WebSocket } = useServerContext();
    const onTabFocus = WebSocket?.checkForExpiredSession;

    const onTabFocus_ = (): void => {
        // Note the extra second (1s in this case) for the timeout before we query whoami, this
        // is to allow time for the server login from the other tab to take hold.
        setTimeout(() => {
            onTabFocus?.();
        }, 1000);
    };

    useEffect(
        () => {
            // Issue 47024: On tab focus in the app, call the WebSocket.checkForExpiredSession
            if (!onTabFocus) return;
            window.addEventListener('focus', onTabFocus_);
            return () => {
                window.removeEventListener('focus', onTabFocus_);
            };
        },
        [
            /* only on component mount */
        ]
    );

    return null;
};

export function withWindowFocusCheckExpiredSession<T>(Component: ComponentType<T>): ComponentType<T> {
    const wrapped: FC<T> = props => {
        useWindowFocusCheckExpiredSession();
        return <Component {...(props as T)} />;
    };

    return wrapped as FC<T>;
}
