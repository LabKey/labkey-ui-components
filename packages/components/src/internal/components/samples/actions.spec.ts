import { List, fromJS } from 'immutable';
import { Filter } from '@labkey/api';
import { QueryInfo } from '../../../public/QueryInfo';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { DataClassDataType, SampleTypeDataType } from '../entities/constants';
import { EntityChoice, IEntityTypeOption } from '../entities/models';

import { AssayDefinitionModel } from '../../AssayDefinitionModel';
import assayDefNoSampleIdJSON from '../../../test/data/assayDefinitionModelNoSampleId.json';
import assayDefJSON from '../../../test/data/assayDefinitionModel.json';

import {
    getUpdatedLineageRows,
    getRowIdsFromSelection,
    createQueryConfigFilteredBySample,
} from './actions';

let DATA = fromJS({
    '1': {
        RowId: 1,
        'MaterialInputs/One': List(),
        'MaterialInputs/Two': List(),
    },
    '2': {
        RowId: 2,
        'MaterialInputs/One': List(),
        'MaterialInputs/Two': List(),
    },
});
DATA = DATA.setIn(
    ['1', 'MaterialInputs/One'],
    List.of({
        value: 1,
        displayValue: 'A',
    })
);
DATA = DATA.setIn(
    ['1', 'MaterialInputs/Two'],
    List.of(
        {
            value: 2,
            displayValue: 'B',
        },
        {
            value: 3,
            displayValue: 'C',
        }
    )
);

describe('getUpdatedLineageRows', () => {
    test('no changes', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'A', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
            ],
            DATA.toJS(),
            []
        );
        expect(updatedRows.length).toBe(0);
    });

    test('add to existing parent', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'A', 'MaterialInputs/Two': 'B, C, D' },
                { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
            ],
            DATA.toJS(),
            []
        );
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(1);
        expect(updatedRows[0]['MaterialInputs/One']).toBe('A');
        expect(updatedRows[0]['MaterialInputs/Two']).toBe('B, C, D');
    });

    test('replace existing parent', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'D', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
            ],
            DATA.toJS(),
            []
        );
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(1);
        expect(updatedRows[0]['MaterialInputs/One']).toBe('D');
        expect(updatedRows[0]['MaterialInputs/Two']).toBe('B, C');
    });

    test('remove existing parent', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': '', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
            ],
            DATA.toJS(),
            []
        );
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(1);
        expect(updatedRows[0]['MaterialInputs/One']).toBe('');
        expect(updatedRows[0]['MaterialInputs/Two']).toBe('B, C');
    });

    test('add new parent', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'A', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': 'A, B', 'MaterialInputs/Two': '' },
            ],
            DATA.toJS(),
            []
        );
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(2);
        expect(updatedRows[0]['MaterialInputs/One']).toBe('A, B');
        expect(updatedRows[0]['MaterialInputs/Two']).toBe('');
    });

    test('exclude aliquots', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'A, B', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': 'A, B', 'MaterialInputs/Two': '' },
            ],
            DATA.toJS(),
            [1, 2]
        );
        expect(updatedRows.length).toBe(0);
    });
});

describe('getSampleRowIdsFromSelection', () => {
    test('none', () => {
        expect(JSON.stringify(getRowIdsFromSelection(undefined))).toBe('[]');
        expect(JSON.stringify(getRowIdsFromSelection(List()))).toBe('[]');
    });
    test('not empty', () => {
        expect(JSON.stringify(getRowIdsFromSelection(List.of('1', '2', '3')))).toBe('[1,2,3]');
        expect(JSON.stringify(getRowIdsFromSelection(List.of(1, 2, 3)))).toBe('[1,2,3]');
    });
});

describe('createQueryConfigFilteredBySample', () => {
    const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
    const modelWithoutSampleId = AssayDefinitionModel.create(assayDefNoSampleIdJSON);

    test('no sample column', () => {
        expect(
            createQueryConfigFilteredBySample(modelWithoutSampleId, 1, Filter.Types.EQUALS, () => 'whereclause')
        ).toBeUndefined();
    });

    test('with sample column', () => {
        const result = createQueryConfigFilteredBySample(
            modelWithSampleId,
            1,
            Filter.Types.EQUALS,
            () => 'whereclause'
        );
        expect(result).toBeDefined();
        expect(result.baseFilters[0].getURLParameterValue()).toBe(1);
        expect(result.baseFilters[0].getURLParameterName()).toBe('query.SampleID/RowId~eq');
        expect(result.omittedColumns).toBeUndefined();
        expect(result.schemaQuery.getKey()).toBe('assay$pgeneral$pgpat 1/data');
        expect(result.title).toBe('GPAT 1');
        expect(result.urlPrefix).toBe('GPAT 1');
    });

    test('useLsid', () => {
        const result = createQueryConfigFilteredBySample(
            modelWithSampleId,
            1,
            Filter.Types.EQUALS,
            () => 'whereclause',
            true
        );
        expect(result).toBeDefined();
        expect(result.baseFilters[0].getURLParameterValue()).toBe(1);
        expect(result.baseFilters[0].getURLParameterName()).toBe('query.SampleID/LSID~eq');
        expect(result.omittedColumns).toBeUndefined();
        expect(result.schemaQuery.getKey()).toBe('assay$pgeneral$pgpat 1/data');
        expect(result.title).toBe('GPAT 1');
        expect(result.urlPrefix).toBe('GPAT 1');
    });

    test('omitSampleCols', () => {
        const result = createQueryConfigFilteredBySample(
            modelWithSampleId,
            1,
            Filter.Types.EQUALS,
            () => 'whereclause',
            false,
            true
        );
        expect(result).toBeDefined();
        expect(result.baseFilters[0].getURLParameterValue()).toBe(1);
        expect(result.baseFilters[0].getURLParameterName()).toBe('query.SampleID/RowId~eq');
        expect(result.omittedColumns).toStrictEqual(['SampleID']);
        expect(result.schemaQuery.getKey()).toBe('assay$pgeneral$pgpat 1/data');
        expect(result.title).toBe('GPAT 1');
        expect(result.urlPrefix).toBe('GPAT 1');
    });
});
