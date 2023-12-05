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
