import React from 'react';
import { mount } from 'enzyme';

import { fromJS, List } from 'immutable';

import { QueryGridModel, QueryColumn, QueryInfo, SchemaQuery, BulkUpdateForm } from '../../..';

import { SamplesBulkUpdateFormBase } from './SamplesBulkUpdateForm';

describe('SamplesBulkUpdateForm', () => {
    const COLUMN_DESCRIPTION = new QueryColumn({
        fieldKey: 'description',
        name: 'description',
        fieldKeyArray: ['description'],
        shownInUpdateView: true,
        userEditable: true,
    });
    const COLUMN_META = new QueryColumn({
        fieldKey: 'meta',
        name: 'meta',
        fieldKeyArray: ['meta'],
        shownInUpdateView: true,
        userEditable: true,
    });
    const COLUMN_ALIQUOT = new QueryColumn({
        fieldKey: 'aliquotspecific',
        name: 'aliquotspecific',
        fieldKeyArray: ['aliquotspecific'],
        shownInUpdateView: false,
        userEditable: true,
    });

    const QUERY_INFO = QueryInfo.fromJSON({
        name: 'test',
        schemaName: 'schema',
        columns: {
            description: COLUMN_DESCRIPTION,
            meta: COLUMN_META,
            aliquotspecific: COLUMN_ALIQUOT,
        },
    });

    const queryGridProps = {
        urlPrefix: 'Sample1',
        queryInfo: QUERY_INFO,
        selectedIds: List.of('1', '2', '3'),
    };

    const queryGridModel = new QueryGridModel(queryGridProps);

    const sampleTypeDomainFields = {
        aliquotFields: ['aliquotspecific'],
        metaFields: ['metadata'],
        metricUnit: 'g',
    };

    const samplesSelection = fromJS(['1', '2', '3']);

    const DEFAULT_PROPS = {
        queryGridModel,
        sampleTypeDomainFields,
        selection: samplesSelection,
        sampleSetLabel: 'sampleType1',
        sampleSet: 'sampleType1',
        aliquots: [],
        noStorageSamples: [],
        selectionInfoError: undefined,
        sampleItems: {},

        updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise.resolve(),
        hasValidMaxSelection: jest.fn,
        onCancel: jest.fn,
        onBulkUpdateError: jest.fn,
        onBulkUpdateComplete: jest.fn,
        editSelectionInGrid: jest.fn,
    };

    const SINGLE_ALIQUOT_WARN =
        '1 aliquot was among the selections. Aliquot data is inherited from the original sample and cannot be updated here.';
    const MULTI_ALIQUOTS_WARN =
        '2 aliquots were among the selections. Aliquot data is inherited from the original sample and cannot be updated here.';

    test('all selected are samples', () => {
        const wrapper = mount(<SamplesBulkUpdateFormBase {...DEFAULT_PROPS} />);
        const queryInfo = wrapper.find(BulkUpdateForm).prop('queryInfo');
        expect(queryInfo.columns.size).toBe(2);
        expect(queryInfo.columns.get('description')).toBe(COLUMN_DESCRIPTION);
        expect(queryInfo.columns.get('meta')).toBe(COLUMN_META);
        wrapper.unmount();
    });

    test('all selected are aliquots', () => {
        const props = {
            ...DEFAULT_PROPS,
            aliquots: [1, 2, 3],
        };
        const wrapper = mount(<SamplesBulkUpdateFormBase {...props} />);
        const queryInfo = wrapper.find(BulkUpdateForm).prop('queryInfo');
        expect(queryInfo.columns.size).toBe(2);
        expect(queryInfo.columns.get('description')).toBe(COLUMN_DESCRIPTION);
        expect(queryInfo.columns.get('aliquotspecific')).toBe(COLUMN_ALIQUOT);

        wrapper.unmount();
    });

    test('samples and one aliquot', () => {
        const props = {
            ...DEFAULT_PROPS,
            aliquots: [1],
        };
        const wrapper = mount(<SamplesBulkUpdateFormBase {...props} />);
        const queryInfo = wrapper.find(BulkUpdateForm).prop('queryInfo');
        expect(queryInfo.columns.size).toBe(2);
        expect(queryInfo.columns.get('description')).toBe(COLUMN_DESCRIPTION);
        expect(queryInfo.columns.get('meta')).toBe(COLUMN_META);

        const aliquotWarning = wrapper.find(BulkUpdateForm).prop('header');
        expect(aliquotWarning.props.children.join('')).toEqual(SINGLE_ALIQUOT_WARN);

        wrapper.unmount();
    });

    test('samples and 2 aliquots', () => {
        const props = {
            ...DEFAULT_PROPS,
            aliquots: [1, 2],
        };
        const wrapper = mount(<SamplesBulkUpdateFormBase {...props} />);
        const queryInfo = wrapper.find(BulkUpdateForm).prop('queryInfo');
        expect(queryInfo.columns.size).toBe(2);
        expect(queryInfo.columns.get('description')).toBe(COLUMN_DESCRIPTION);
        expect(queryInfo.columns.get('meta')).toBe(COLUMN_META);

        const aliquotWarning = wrapper.find(BulkUpdateForm).prop('header');
        expect(aliquotWarning.props.children.join('')).toEqual(MULTI_ALIQUOTS_WARN);

        wrapper.unmount();
    });
});
