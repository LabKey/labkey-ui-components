import { InjectedRouter, WithRouterProps } from "react-router";

/**
 * Util function for creating a WithRouterProps object, useful for testing components that expect to be wrapped by
 * withRouter, or components rendered by a Route component.
 */
export const createMockWithRouterProps = (): WithRouterProps => {
    const router: InjectedRouter = {
        createHref: jest.fn(),
        createPath: jest.fn(),
        go: jest.fn(),
        goBack: jest.fn(),
        goForward: jest.fn(),
        isActive: jest.fn(),
        push: jest.fn(),
        replace: jest.fn(),
        setRouteLeaveHook: jest.fn(),
    };

    return {
        router: router,
        location: {
            pathname: '',
            search: '',
            query: {},
            hash: '',
            state: undefined,
            action: 'PUSH',
            key: '',
        },
        params: {},
        routes: [],
    };
};
