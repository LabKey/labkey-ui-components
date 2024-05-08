import React from 'react';

import { render } from '@testing-library/react';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';
import { LoadingState } from '../../../public/LoadingState';

import { SampleStatusLegendImpl } from './SampleStatusLegend';

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

    function validate(loading: boolean, statusCount = 0): void {
        if (loading) {
            expect(document.querySelector('.fa-spinner')).not.toBeNull();
            expect(document.querySelector('.sample-status-legend--table')).toBeNull();
        } else {
            expect(document.querySelector('.fa-spinner')).toBeNull();
            expect(document.querySelector('.sample-status-legend--table')).not.toBeNull();
            expect(document.querySelector('.sample-status-legend--table').querySelectorAll('tr')).toHaveLength(
                statusCount === 0 ? 1 : statusCount
            );
        }
        expect(document.querySelectorAll('.sample-status-legend--description')).toHaveLength(statusCount);
    }

    test('loading', () => {
        render(<SampleStatusLegendImpl {...DEFAULT_PROPS} queryModels={{ model: MODEL_LOADING }} />);
        validate(true);
    });

    test('no rows', () => {
        render(<SampleStatusLegendImpl {...DEFAULT_PROPS} queryModels={{ model: MODEL_NO_ROWS }} />);
        validate(false);
        const tds = document.querySelectorAll('td');
        expect(tds).toHaveLength(1);
        expect(tds.item(0).textContent).toBe('No sample statuses are defined.');
    });

    test('with rows', () => {
        renderWithAppContext(<SampleStatusLegendImpl {...DEFAULT_PROPS} queryModels={{ model: MODEL_WITH_ROWS }} />);
        validate(false, 3);
        const descriptions = document.querySelectorAll('.sample-status-legend--description');
        expect(descriptions.item(0).textContent).toBe('');
        expect(descriptions.item(1).textContent).toBe('');
        expect(descriptions.item(2).textContent).toBe('with desc');
    });
});
