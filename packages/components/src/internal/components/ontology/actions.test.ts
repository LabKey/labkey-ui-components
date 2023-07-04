import { CONCEPT_CACHE, getConceptForCode, getParentsConceptCodePath } from './actions';
import { ConceptModel, ONTOLOGY_ROOT_CODE_PREFIX, PathModel } from './models';

describe('getParentsConceptCodePath', () => {
    test('no parents', () => {
        expect(getParentsConceptCodePath([])).toBe('');
    });

    test('only root', () => {
        expect(getParentsConceptCodePath([new PathModel({ code: ONTOLOGY_ROOT_CODE_PREFIX })])).toBe('');
    });

    test('one parent', () => {
        expect(
            getParentsConceptCodePath([
                new PathModel({ code: ONTOLOGY_ROOT_CODE_PREFIX }),
                new PathModel({ code: 'a' }),
            ])
        ).toBe('a');
    });

    test('multiple parent', () => {
        expect(
            getParentsConceptCodePath([
                new PathModel({ code: ONTOLOGY_ROOT_CODE_PREFIX }),
                new PathModel({ code: 'a' }),
                new PathModel({ code: 'b' }),
            ])
        ).toBe('a/b');
    });
});

const CONCEPT_A = new ConceptModel({ code: 'a', label: 'A' });
const CONCEPT_B = new ConceptModel({ code: 'b', label: 'B' });
beforeAll(() => {
    // prime cache
    CONCEPT_CACHE.set(CONCEPT_A.code, CONCEPT_A);
    CONCEPT_CACHE.set(CONCEPT_B.code, CONCEPT_B);
});

describe('getConceptForCode', () => {
    test('no code', () => {
        expect(getConceptForCode(undefined)).toBeUndefined();
        expect(getConceptForCode(null)).toBeUndefined();
        expect(getConceptForCode('')).toBeUndefined();
    });

    test('cache hit', () => {
        expect(getConceptForCode(CONCEPT_A.code)).toBe(CONCEPT_A);
        expect(getConceptForCode(CONCEPT_B.code)).toBe(CONCEPT_B);
    });
});
