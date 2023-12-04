import { DeprecatedRouter } from './routerTypes';
import { DeprecatedWithRouterProps } from './withRouterDeprecated';
import { InjectedRouteLeaveProps } from './util/RouteLeave';

/**
 * Util function for creating an InjectedRouteLeaveProps object, useful for testing components
 * that expect to be wrapped by withRouteLeave.
 *
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export const createMockWithRouteLeave = (
    mockFn = (): any => () => {},
    overrides: Partial<InjectedRouteLeaveProps> = {}
): InjectedRouteLeaveProps => {
    return {
        getIsDirty: () => false,
        setIsDirty: mockFn(),
        ...overrides,
    };
};

/**
 * Util function for creating a WithRouterProps object, useful for testing components that expect to be wrapped by
 * withRouter, or components rendered by a Route component.
 *
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export const createMockWithRouterProps = (
    mockFn = (): any => () => {},
    routerOverrides: Partial<DeprecatedRouter> = {}
): DeprecatedWithRouterProps => {
    const defaultRouter: DeprecatedRouter = {
        goBack: mockFn(),
        goForward: mockFn(),
        push: mockFn(),
        replace: mockFn(),
    };

    return {
        location: {
            pathname: '',
            search: '',
            query: {},
            hash: '',
            state: undefined,
            key: '',
        },
        params: {},
        router: Object.assign(defaultRouter, routerOverrides),
    };
};
