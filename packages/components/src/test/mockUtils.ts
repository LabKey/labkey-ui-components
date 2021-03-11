import { InjectedRouter, WithRouterProps } from 'react-router';

/**
 * Util function for creating a WithRouterProps object, useful for testing components that expect to be wrapped by
 * withRouter, or components rendered by a Route component.
 *
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export const createMockWithRouterProps = (
    mockFn = (): any => () => {},
    routerOverrides: Partial<InjectedRouter> = {}
): WithRouterProps => {
    const defaultRouter: InjectedRouter = {
        createHref: mockFn(),
        createPath: mockFn(),
        go: mockFn(),
        goBack: mockFn(),
        goForward: mockFn(),
        isActive: mockFn(),
        push: mockFn(),
        replace: mockFn(),
        setRouteLeaveHook: mockFn(),
    };

    return {
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
        router: Object.assign(defaultRouter, routerOverrides),
        routes: [],
    };
};
