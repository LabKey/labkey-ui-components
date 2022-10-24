import { Map } from 'immutable';

import { AppURL } from '../internal/url/AppURL';

import { AssayResolver, AssayRunResolver } from './AssayResolver';

describe('Assay Route Resolvers', () => {
    test('Should resolve /assays routes', () => {
        const routes = Map<number, { name: string; provider: string }>().asMutable();
        routes.set(13, {
            provider: 'general',
            name: 'thirteen',
        });
        routes.set(91, {
            provider: 'specific',
            name: 'ninety-one',
        });
        const assayResolver = new AssayResolver(routes.asImmutable());

        // test regex
        expect.assertions(8);
        expect(assayResolver.matches(undefined)).toBe(false);
        expect(assayResolver.matches('/assays/91f')).toBe(false);
        expect(assayResolver.matches('/assays/91')).toBe(true);
        expect(assayResolver.matches('/assays/91/foo')).toBe(true);
        expect(assayResolver.matches('/assays/91/foo?bar=1')).toBe(true);

        return Promise.all([
            assayResolver.fetch(['assays', 'foo']).then((result: boolean) => {
                expect(result).toBe(true);
            }),
            assayResolver.fetch(['assays', '13']).then((url: AppURL) => {
                expect(url.toString()).toBe('/assays/general/thirteen');
            }),
            assayResolver.fetch(['assays', '91', 'foo bar']).then((url: AppURL) => {
                expect(url.toString()).toBe('/assays/specific/ninety-one/foo%20bar');
            }),
        ]);
    });

    test('Should resolve /rd/assayrun routes', () => {
        const routes = Map<number, number>().asMutable();
        routes.set(595, 13);
        routes.set(923, 15);

        const assayRunResolver = new AssayRunResolver(routes.asImmutable());

        // test regex
        expect.assertions(8);
        expect(assayRunResolver.matches(undefined)).toBe(false);
        expect(assayRunResolver.matches('/rd/assayrun/91f')).toBe(false);
        expect(assayRunResolver.matches('/rd/assayrun/91')).toBe(true);
        expect(assayRunResolver.matches('/rd/assayrun/91/foo')).toBe(true);
        expect(assayRunResolver.matches('/rd/assayrun/91/foo?bar=1')).toBe(true);

        return Promise.all([
            assayRunResolver.fetch(['rd', 'assayrun', 'boom']).then(result => {
                expect(result).toBe(true);
            }),
            assayRunResolver.fetch(['rd', 'assayrun', '923']).then(result => {
                expect(result.toString()).toBe('/assays/15/runs/923');
            }),
            assayRunResolver.fetch(['rd', 'assayrun', '595', 'extra']).then(result => {
                expect(result.toString()).toBe('/assays/13/runs/595/extra');
            }),
        ]);
    });
});
