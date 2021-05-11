import { Container } from './Container';

describe('Container', () => {
    test('hasActiveModule', () => {
        const container = new Container({ activeModules: ['Query'] });
        expect(container.hasActiveModule(undefined)).toBeFalsy();
        expect(container.hasActiveModule(null)).toBeFalsy();
        expect(container.hasActiveModule('bogus')).toBeFalsy();
        expect(container.hasActiveModule('query')).toBeFalsy();
        expect(container.hasActiveModule('Query')).toBeTruthy();
    });
});
