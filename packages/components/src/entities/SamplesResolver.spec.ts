import { List, Map } from 'immutable';

import { AppURL } from '../internal/url/AppURL';

import { SamplesResolver } from './SamplesResolver';

describe('SamplesResolver', () => {
    test('Should resolve /rd/samples/### routes', () => {
        const routes = Map<number, List<string>>().asMutable();
        routes.set(7, List(['samples', 'Elway']));
        routes.set(30, List(['samples', 'TD']));
        routes.set(80, List(['samples', 'RodSmith']));
        routes.set(24, List(['media', 'Woodson']));
        const samplesResolver = new SamplesResolver(routes.asImmutable());

        // test regex
        expect.assertions(11);
        expect(samplesResolver.matches(undefined)).toBe(false);
        expect(samplesResolver.matches('/rd/samples/f23')).toBe(false);
        expect(samplesResolver.matches('/rd/samples/2.3')).toBe(false);
        expect(samplesResolver.matches('/rd/samples/80')).toBe(true);
        expect(samplesResolver.matches('/rd/samples/3221/foo/bar')).toBe(true);
        expect(samplesResolver.matches('/rd/samples/919/foo/bar?bar=1')).toBe(true);

        return Promise.all([
            samplesResolver.fetch(['rd', 'samples', 'notvalid', 14]).then((result: boolean) => {
                expect(result).toBe(true);
            }),
            samplesResolver.fetch(['rd', 'samples', 30]).then((url: AppURL) => {
                expect(url.toString()).toBe('/samples/TD/30');
            }),
            samplesResolver.fetch(['rd', 'samples', '80', 'wideOut']).then((url: AppURL) => {
                expect(url.toString()).toBe('/samples/RodSmith/80/wideOut');
            }),
            samplesResolver.fetch(['rd', 'samples', '7', 77, '?']).then((url: AppURL) => {
                expect(url.toString()).toBe('/samples/Elway/7/77/%3F');
            }),
            samplesResolver.fetch(['rd', 'samples', 24]).then((url: AppURL) => {
                expect(url.toString()).toBe('/media/Woodson/24');
            }),
        ]);
    });
});
