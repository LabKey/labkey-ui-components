/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
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
