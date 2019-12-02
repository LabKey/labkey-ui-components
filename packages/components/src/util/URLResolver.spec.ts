import { parsePathName, URLResolver } from './URLResolver'

import { fromJS } from 'immutable';
import entitiesJSON from '../test/data/sampleSetSearchResult.json';


describe("resolveSearchUsingIndex", () => {
    test("resolve Sample Set url", () => {
        const resolver = new URLResolver();
        const testJson = fromJS(entitiesJSON);
        return resolver.resolveSearchUsingIndex(testJson).then(resolved => {
            expect(resolved).toHaveProperty(['hits']);
            expect(resolved).toHaveProperty(['hits', 0]);
            expect(resolved).toHaveProperty(['hits', 0, 'url'], "#/samples/molecule");
            expect(resolved).toHaveProperty(['hits', 0, 'data', 'name'], "Molecule"); //not sure if this is best place to check this...
        });
    });
});

describe("parsePathName", () => {
    test("old style", () => {
        let url = "/labkey/controller/my%20folder/my%20path/action.view?extra=123"
        expect(parsePathName(url)).toEqual({
            controller: 'controller',
            action: 'action',
            containerPath: '/my folder/my path'
        });
    });

    test("new style", () => {
        let url = "/labkey/my%20folder/my%20path/controller-action.view?extra=123"
        expect(parsePathName(url)).toEqual({
            controller: 'controller',
            action: 'action',
            containerPath: '/my folder/my path'
        });
    });
});
