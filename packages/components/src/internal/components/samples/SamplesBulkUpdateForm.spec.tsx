import React from 'react';
import { mount } from 'enzyme';

import { fromJS } from 'immutable';

import { Alert, BulkUpdateForm, makeTestQueryModel, QueryColumn, QueryInfo, SchemaQuery, } from '../../..';

import { OperationConfirmationData } from '../entities/models';
import { SamplesBulkUpdateAlert, SamplesBulkUpdateFormBase } from './SamplesBulkUpdateForm';
import { getSamplesTestAPIWrapper } from './APIWrapper';

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

    const sampleTypeDomainFields = {
        aliquotFields: ['aliquotspecific'],
        metaFields: ['metadata'],
        metricUnit: 'g',
    };

    const samplesSelection = fromJS(['1', '2', '3']);

    const DEFAULT_PROPS = {
        queryModel: makeTestQueryModel(SchemaQuery.create('schema', 'query'), QUERY_INFO).mutate({
            urlPrefix: 'Sample1',
            selections: new Set(['1', '2', '3']),
        }),
        sampleTypeDomainFields,
        selection: samplesSelection,
        sampleSetLabel: 'sampleType1',
        sampleSet: 'sampleType1',
        aliquots: [],
        noStorageSamples: [],
        editStatusData: new OperationConfirmationData({}),
        selectionInfoError: undefined,
        sampleItems: {},
        sampleLineageKeys: undefined,
        sampleLineage: undefined,

        updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise.resolve(),
        hasValidMaxSelection: jest.fn,
        onCancel: jest.fn,
        onBulkUpdateError: jest.fn,
        onBulkUpdateComplete: jest.fn,
        editSelectionInGrid: jest.fn,
        api: getSamplesTestAPIWrapper(),
    };


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


});

describe("SamplesBulkUpdateAlert", () => {

    const SINGLE_ALIQUOT_WARN =
        '1 aliquot was among the selections. Aliquot data is inherited from the original sample and cannot be updated here. ';
    const MULTI_ALIQUOTS_WARN =
        '2 aliquots were among the selections. Aliquot data is inherited from the original sample and cannot be updated here. ';
    const ALL_ALIQUOTS_WARN = 'Aliquot data inherited from the original sample cannot be updated here.';
    const ONE_LOCKED_WARN = 'The current status of 1 selected sample prevents updating of its data. Either change the status here or remove these samples from your selection.';
    const TWO_LOCKED_WARN = 'The current status of 2 selected samples prevents updating of their data. Either change the status here or remove these samples from your selection.';

    test('samples and one aliquot, no editStatusData', () => {
        const wrapper = mount(<SamplesBulkUpdateAlert aliquots={[1]} numSelections={3} editStatusData={undefined} />);
        expect(wrapper.find(Alert).exists()).toBeTruthy();
        expect(wrapper.text()).toBe(SINGLE_ALIQUOT_WARN);
        wrapper.unmount();
    });

    test('samples and 2 aliquots', () => {
        const wrapper = mount(<SamplesBulkUpdateAlert aliquots={[1,2]} numSelections={3} editStatusData={undefined} />);
        expect(wrapper.find(Alert).exists()).toBeTruthy();
        expect(wrapper.text()).toBe(MULTI_ALIQUOTS_WARN);
        wrapper.unmount();
    });

    test('only aliquots', () => {
        const wrapper = mount(<SamplesBulkUpdateAlert aliquots={[1,2]} numSelections={2} editStatusData={undefined} />);
        expect(wrapper.find(Alert).exists()).toBeTruthy();
        expect(wrapper.text()).toBe(ALL_ALIQUOTS_WARN);
        wrapper.unmount();
    });

    test('only aliquots, some locked', () => {
        const wrapper = mount(
            <SamplesBulkUpdateAlert
                aliquots={[1,2]}
                numSelections={2}
                editStatusData={new OperationConfirmationData({
                    allowed: [{
                        Name: 'A-1',
                        RowId: 1
                    }],
                    notAllowed: [{
                        Name: 'A-2',
                        RowId: 2,
                    }
                    ]
                })}
            />);
        expect(wrapper.find(Alert).exists()).toBeTruthy();
        expect(wrapper.text()).toBe(ALL_ALIQUOTS_WARN + ' ' + ONE_LOCKED_WARN);
        wrapper.unmount();
    });

    test('some aliquots, some locked', () => {
        const wrapper = mount(
            <SamplesBulkUpdateAlert
                aliquots={[1,2]}
                numSelections={3}
                editStatusData={new OperationConfirmationData({
                    allowed: [{
                        Name: 'A-1',
                        RowId: 1
                    }],
                    notAllowed: [{
                        Name: 'A-2',
                        RowId: 2,
                    }, {
                        Name: 'A-3',
                        RowId: 3,
                    }
                    ]
                })}
            />);
        expect(wrapper.find(Alert).exists()).toBeTruthy();
        expect(wrapper.text()).toBe(MULTI_ALIQUOTS_WARN + ' ' + ONE_LOCKED_WARN);
        wrapper.unmount();
    });

    test ('no aliquots, some locked', () => {
        const wrapper = mount(
            <SamplesBulkUpdateAlert
                aliquots={[]}
                numSelections={3}
                editStatusData={new OperationConfirmationData({
                    allowed: [{
                        Name: 'A-1',
                        RowId: 1
                    }],
                    notAllowed: [{
                        Name: 'A-2',
                        RowId: 2,
                    }, {
                        Name: 'A-3',
                        RowId: 3,
                    }
                    ]
                })}
            />);
        expect(wrapper.find(Alert).exists()).toBeTruthy();
        expect(wrapper.text()).toBe(TWO_LOCKED_WARN);
        wrapper.unmount();
    });

    test ('no aliquots, all allowed', () => {
        const wrapper = mount(
            <SamplesBulkUpdateAlert
                aliquots={[]}
                numSelections={3}
                editStatusData={new OperationConfirmationData({
                    allowed: [{
                        Name: 'A-1',
                        RowId: 1
                    }, {
                        Name: 'A-2',
                        RowId: 2,
                    }, {
                        Name: 'A-3',
                        RowId: 3,
                    }
                    ]
                })}
            />);
        expect(wrapper.find(Alert).exists()).toBeFalsy();
    });
});
