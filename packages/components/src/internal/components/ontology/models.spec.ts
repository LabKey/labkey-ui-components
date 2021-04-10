import { ConceptModel, OntologyModel } from './models';

describe('OntologyModel', () => {
    test('create', () => {
        expect(OntologyModel.create({}).name).toBe(undefined);
        expect(OntologyModel.create({ name: {} }).name).toBe(undefined);
        expect(OntologyModel.create({ Name: {} }).name).toBe(undefined);
        expect(OntologyModel.create({ name: { value: 'test' } }).name).toBe('test');
        expect(OntologyModel.create({ Name: { value: 'test' } }).name).toBe('test');
    });

    test('getDisplayName', () => {
        expect(
            OntologyModel.create({
                Name: { value: 'test' },
                Abbreviation: { value: 'T' },
            }).getDisplayName()
        ).toBe('test (T)');

        expect(
            OntologyModel.create({
                Name: { value: 'test' },
                Abbreviation: { value: 'test' },
            }).getDisplayName()
        ).toBe('test');
    });
});

describe('ConceptModel', () => {
    test('getDisplayLabel', () => {
        expect(new ConceptModel({}).getDisplayLabel()).toBe('undefined (undefined)');
        expect(new ConceptModel({ code: 'a', label: 'b' }).getDisplayLabel()).toBe('b (a)');
    });
});
