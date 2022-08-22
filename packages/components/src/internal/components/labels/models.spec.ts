import { BarTenderConfiguration } from './models';

describe('BarTenderConfiguration', () => {
    test('isConfigured', () => {
        expect(new BarTenderConfiguration().isConfigured()).toBeFalsy();
        expect(new BarTenderConfiguration({ serviceURL: undefined }).isConfigured()).toBeFalsy();
        expect(new BarTenderConfiguration({ serviceURL: null }).isConfigured()).toBeFalsy();
        expect(new BarTenderConfiguration({ serviceURL: '' }).isConfigured()).toBeFalsy();
        expect(new BarTenderConfiguration({ serviceURL: ' test ' }).isConfigured()).toBeTruthy();
    });
});
