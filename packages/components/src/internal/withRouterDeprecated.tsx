import React, { Component, ComponentType, FC, useMemo } from 'react';
import { Params, useLocation, useNavigate, useParams } from 'react-router-dom';
import { DeprecatedLocation, DeprecatedRouter } from './routerTypes';
import { getQueryParams } from './util/URL';

export interface DeprecatedWithRouterProps {
    router: DeprecatedRouter;
    location: DeprecatedLocation;
    params: Params;
}

type WithRouterComponent<T> = ComponentType<T & DeprecatedWithRouterProps>;

/**
 * @deprecated This wrapper is so we can transition to React Router 6 over time, without having to refactor nearly all
 * of our page components, and many other components that used withRouter from React Router 3. If you are writing a new
 * component you should not use this, instead use the official React Router hooks.
 * @param Component
 */
export function withRouterDeprecated<T>(Component: WithRouterComponent<T>): ComponentType<T> {
    const Wrapped: FC<T & DeprecatedWithRouterProps> = (props: T) => {
        const navigate = useNavigate();
        const params = useParams();
        const location = useLocation();
        const router = useMemo(
            () => ({
                goBack: () => {
                    navigate(-1);
                },
                goForward: () => {
                    navigate(1);
                },
                push: path => {
                    navigate(path);
                },
                replace: path => {
                    navigate(path, { replace: true });
                },
                setRouteLeaveHook: () => {
                    // FIXME: temporary no-op while I get stuff to compile, this will be removed before merging
                },
            }),
            [navigate]
        );
        const deprecatedLocation = {
            ...location,
            query: getQueryParams(location.search),
        };
        return <Component location={deprecatedLocation} params={params} router={router} {...props} />;
    };

    return Wrapped;
}
