import {
    URLResolver
} from './URLResolver'

import {fromJS} from "immutable";
import entitiesJSON from "../test/data/sampleSetSearchResult.json";


describe("resolveSearchUsingIndex", () => {
    test("resolve Sample Set url", () => {
        const resolver = new URLResolver();
        const testJson = fromJS(JSON.parse(JSON.stringify(entitiesJSON)));
        return resolver.resolveSearchUsingIndex(testJson).then(resolved => {
            expect(resolved).toHaveProperty(['hits']);
            expect(resolved).toHaveProperty(['hits', 0]);
            expect(resolved).toHaveProperty(['hits', 0, 'url'], "#/samples/molecule");
            expect(resolved).toHaveProperty(['hits', 0, 'data', 'name'], "Molecule"); //not sure if this is best place to check this...
        });
    });
});