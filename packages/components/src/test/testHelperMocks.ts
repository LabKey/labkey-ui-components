import mock, { proxy } from 'xhr-mock';

import { initDomainPropertiesMocks, initQueryGridMocks, initUserPropsMocks } from './mock';

/**
 * Use this method in beforeAll() for your jest tests and you'll have full access
 * to all of the same mock API responses we use in storybook.
 */
export function initUnitTestMocks(extraMocks?: Array<() => void>): void {
    window['__react-beautiful-dnd-disable-dev-warnings'] = true;
    mock.setup();
    initQueryGridMocks();
    initDomainPropertiesMocks();
    initUserPropsMocks();
    extraMocks?.forEach(extraMock => extraMock());
    mock.use(proxy);
}
