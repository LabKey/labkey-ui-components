import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Panel } from 'react-bootstrap';

import { HorizontalBarSection } from '../chart/HorizontalBarSection';
import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';
import { LoadingState } from '../../../public/LoadingState';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { LabelHelpTip } from '../base/LabelHelpTip';

import { INSIGHTS_MODEL_ID, SampleTypeInsightsPanelImpl, STATUS_COUNTS_MODEL_ID } from './SampleTypeInsightsPanel';

describe('SampleTypeInsightsPanel', () => {
    const SQ = SchemaQuery.create('schema', 'query');
    const MODEL_NO_ROWS = makeTestQueryModel(SQ, new QueryInfo(), {}, [], 0).mutate({
        queryInfoLoadingState: LoadingState.LOADED,
        rowsLoadingState: LoadingState.LOADED,
    });
    const MODEL_INSIGHTS = makeTestQueryModel(
        SQ,
        new QueryInfo(),
        {
            1: {
                AliquotCount: { value: 3 },
                CheckedOutCount: { value: 1 },
                InStorageCount: { value: 4 },
                NonAliquotCount: { value: 12 },
                NotInStorageCount: { value: 10 },
                SampleSet: { value: 'Blood' },
                TotalCount: { value: 15 },
            },
        },
        ['1'],
        1
    ).mutate({ queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED });
    const MODEL_STATUS_COUNTS = makeTestQueryModel(
        SQ,
        new QueryInfo(),
        {
            1: {
                Status: { value: 'Available' },
                RowId: { value: 1833 },
                TotalCount: { value: 2 },
                WithStatusCount: { value: 2 },
                Color: { value: '#dff0d8' },
                ClassName: { value: 'bar-insights--available' },
                NoStatusCount: { value: 0 },
                Name: { value: 'b' },
            },
            2: {
                Status: { value: 'Consumed' },
                RowId: { value: 1833 },
                TotalCount: { value: 1 },
                WithStatusCount: { value: 1 },
                Color: { value: '#faebcc' },
                ClassName: { value: 'bar-insights--consumed' },
                NoStatusCount: { value: 0 },
                Name: { value: 'b' },
            },
            3: {
                Status: { value: 'Locked' },
                RowId: { value: 1833 },
                TotalCount: { value: 2 },
                WithStatusCount: { value: 2 },
                Color: { value: '#f2dede' },
                ClassName: { value: 'bar-insights--locked' },
                NoStatusCount: { value: 0 },
                Name: { value: 'b' },
            },
            4: {
                Status: { value: 'No Status' },
                RowId: { value: 1833 },
                TotalCount: { value: 10 },
                WithStatusCount: { value: 0 },
                Color: { value: '#eeeeee' },
                ClassName: { value: null },
                NoStatusCount: { value: 10 },
                Name: { value: 'b' },
            },
        },
        ['1', '2', '3', '4'],
        4
    ).mutate({ queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED });
    const MODEL_LOADING = makeTestQueryModel(SQ).mutate({
        queryInfoLoadingState: LoadingState.LOADED,
        rowsLoadingState: LoadingState.LOADING,
    });
    const DEFAULT_PROPS = {
        sampleSet: 'Blood',
        actions: makeTestActions(),
    };

    function validate(wrapper: ReactWrapper, loading: boolean, hasData = true): void {
        expect(wrapper.find(Panel)).toHaveLength(1);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(loading ? 1 : 0);
        expect(wrapper.find(HorizontalBarSection)).toHaveLength(!loading ? 3 : 0);
        expect(wrapper.find(LabelHelpTip)).toHaveLength(!loading && hasData ? 1 : 0);
    }

    test('loading', () => {
        const wrapper = mount(
            <SampleTypeInsightsPanelImpl
                {...DEFAULT_PROPS}
                queryModels={{
                    [INSIGHTS_MODEL_ID]: MODEL_INSIGHTS,
                    [STATUS_COUNTS_MODEL_ID]: MODEL_LOADING,
                }}
            />
        );
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('with data', () => {
        const wrapper = mount(
            <SampleTypeInsightsPanelImpl
                {...DEFAULT_PROPS}
                queryModels={{
                    [INSIGHTS_MODEL_ID]: MODEL_INSIGHTS,
                    [STATUS_COUNTS_MODEL_ID]: MODEL_STATUS_COUNTS,
                }}
            />
        );
        validate(wrapper, false);
        expect(wrapper.find(HorizontalBarSection).at(0).prop('subtitle')).toBe('4 of 15 samples are in storage (26%)');
        const storageStatusData = wrapper.find(HorizontalBarSection).at(0).prop('data');
        expect(storageStatusData.length).toBe(3);
        expect(storageStatusData[0].count).toBe(1);
        expect(storageStatusData[0].filled).toBe(true);
        expect(storageStatusData[0].href).toBe('#/samples/Blood?query.StorageStatus~eq=Checked out');
        expect(storageStatusData[0].title).toBe('1 of 15 samples are checked out');
        expect(storageStatusData[1].count).toBe(4);
        expect(storageStatusData[1].filled).toBe(true);
        expect(storageStatusData[1].href).toBe('#/samples/Blood?query.StorageStatus~eq=In storage');
        expect(storageStatusData[1].title).toBe('4 of 15 samples are in storage');
        expect(storageStatusData[2].count).toBe(10);
        expect(storageStatusData[2].filled).toBe(false);
        expect(storageStatusData[2].href).toBe('#/samples/Blood?query.StorageStatus~eq=Not in storage');
        expect(storageStatusData[2].title).toBe('10 of 15 samples are not in storage');

        const sampleStatusData = wrapper.find(HorizontalBarSection).at(1).prop('data');
        expect(sampleStatusData.length).toBe(4);
        expect(sampleStatusData[0].className).toBe('bar-insights--available');
        expect(sampleStatusData[0].count).toBe(2);
        expect(sampleStatusData[0].filled).toBe(true);
        expect(sampleStatusData[0].href).toBe('#/samples/b?query.SampleState/Label~eq=Available');
        expect(sampleStatusData[0].title).toBe("2 'Available' samples");
        expect(sampleStatusData[3].className).toBe(null);
        expect(sampleStatusData[3].count).toBe(10);
        expect(sampleStatusData[3].filled).toBe(false);
        expect(sampleStatusData[3].href).toBe('#/samples/b?query.SampleState/Label~isblank=');
        expect(sampleStatusData[3].title).toBe("10 'No Status' samples");

        expect(wrapper.find(HorizontalBarSection).at(2).prop('subtitle')).toBe('3 of 15 samples are aliquots (20%)');
        const aliquotData = wrapper.find(HorizontalBarSection).at(2).prop('data');
        expect(aliquotData.length).toBe(2);
        expect(aliquotData[0].count).toBe(3);
        expect(aliquotData[0].filled).toBe(true);
        expect(aliquotData[0].href).toBe('#/samples/Blood?query.IsAliquot~eq=true');
        expect(aliquotData[0].title).toBe('3 of 15 samples are aliquots');
        expect(aliquotData[1].count).toBe(12);
        expect(aliquotData[1].filled).toBe(false);
        expect(aliquotData[1].href).toBe('#/samples/Blood?query.IsAliquot~eq=false');
        expect(aliquotData[1].title).toBe('12 of 15 samples are not aliquots');

        wrapper.unmount();
    });

    test('no data', () => {
        const wrapper = mount(
            <SampleTypeInsightsPanelImpl
                {...DEFAULT_PROPS}
                queryModels={{
                    [INSIGHTS_MODEL_ID]: MODEL_NO_ROWS,
                    [STATUS_COUNTS_MODEL_ID]: MODEL_NO_ROWS,
                }}
            />
        );
        validate(wrapper, false, false);
        expect(wrapper.find(HorizontalBarSection).at(0).prop('subtitle')).toBe(undefined);
        expect(wrapper.find(HorizontalBarSection).at(0).prop('data')).toStrictEqual([]);
        expect(wrapper.find(HorizontalBarSection).at(1).prop('subtitle')).toBe(false);
        expect(wrapper.find(HorizontalBarSection).at(1).prop('data')).toStrictEqual([]);
        expect(wrapper.find(HorizontalBarSection).at(2).prop('subtitle')).toBe(undefined);
        expect(wrapper.find(HorizontalBarSection).at(2).prop('data')).toStrictEqual([]);
        wrapper.unmount();
    });
});
