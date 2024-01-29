import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';
import { LoadingState } from '../../../public/LoadingState';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { mountWithAppServerContext } from '../../test/enzymeTestHelpers';

import { SampleStatusLegendImpl } from './SampleStatusLegend';
import { SampleStatusTag } from './SampleStatusTag';

describe('SampleStatusLegend', () => {
    const SQ = new SchemaQuery('schema', 'query');
    const MODEL_NO_ROWS = makeTestQueryModel(SQ, new QueryInfo({}), {}, [], 0).mutate({
        queryInfoLoadingState: LoadingState.LOADED,
        rowsLoadingState: LoadingState.LOADED,
    });
    const MODEL_LOADING = makeTestQueryModel(SQ).mutate({
        queryInfoLoadingState: LoadingState.LOADED,
        rowsLoadingState: LoadingState.LOADING,
    });
    const MODEL_WITH_ROWS = makeTestQueryModel(
        SQ,
        new QueryInfo({}),
        {
            1: {
                Label: { value: 'Available' },
                Description: { value: undefined },
            },
            2: {
                Label: { value: 'Consumed' },
                Description: { value: undefined },
            },
            3: {
                Label: { value: 'Locked' },
                Description: { value: 'with desc' },
            },
        },
        ['1', '2', '3'],
        2
    ).mutate({
        queryInfoLoadingState: LoadingState.LOADED,
        rowsLoadingState: LoadingState.LOADED,
    });

    const DEFAULT_PROPS = {
        actions: makeTestActions(),
    };

    function validate(wrapper: ReactWrapper, loading: boolean, statusCount = 0): void {
        expect(wrapper.find(LoadingSpinner)).toHaveLength(loading ? 1 : 0);
        expect(wrapper.find('.sample-status-legend--table')).toHaveLength(!loading ? 1 : 0);
        expect(wrapper.find(SampleStatusTag)).toHaveLength(statusCount);
        expect(wrapper.find('.sample-status-legend--description')).toHaveLength(statusCount);
    }

    test('loading', () => {
        const wrapper = mount(<SampleStatusLegendImpl {...DEFAULT_PROPS} queryModels={{ model: MODEL_LOADING }} />);
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('no rows', () => {
        const wrapper = mount(<SampleStatusLegendImpl {...DEFAULT_PROPS} queryModels={{ model: MODEL_NO_ROWS }} />);
        validate(wrapper, false);
        expect(wrapper.find('td')).toHaveLength(1);
        expect(wrapper.find('td').text()).toBe('No sample statuses are defined.');
        wrapper.unmount();
    });

    test('with rows', () => {
        const wrapper = mountWithAppServerContext(
            <SampleStatusLegendImpl {...DEFAULT_PROPS} queryModels={{ model: MODEL_WITH_ROWS }} />
        );
        validate(wrapper, false, 3);
        expect(wrapper.find('.sample-status-legend--description').at(0).text()).toBe('');
        expect(wrapper.find('.sample-status-legend--description').at(1).text()).toBe('');
        expect(wrapper.find('.sample-status-legend--description').at(2).text()).toBe('with desc');
        wrapper.unmount();
    });
});
