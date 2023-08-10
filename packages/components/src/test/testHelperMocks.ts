import mock, { proxy } from 'xhr-mock';

/**
 * Use this method in beforeAll() for your jest tests and you'll have full access
 * to all of the same mock API responses we use in storybook.
 */
export function initUnitTestMocks(mockInitializers: Array<() => void>): void {
    if (mockInitializers === undefined || mockInitializers.length === 0) {
        console.error(
            'You must pass an array of mock initializers to initUnitTestMocks. If you do not have a relevant mockInitializer you do not need to use this method'
        );
    }
    window['__react-beautiful-dnd-disable-dev-warnings'] = true;
    mock.setup();
    mockInitializers?.forEach(extraMock => extraMock());
    mock.use(proxy);
}
