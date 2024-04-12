import React from 'react';
import { act } from 'react-dom/test-utils';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { LoadingState } from '../../../public/LoadingState';

import { QueryInfo } from '../../../public/QueryInfo';

import { getTestAPIWrapper } from '../../APIWrapper';
import { InjectedQueryModels } from '../../../public/QueryModel/withQueryModels';

import { PrintLabelsModalImpl, PrintModalProps } from './PrintLabelsModal';

describe('PrintLabelsModal', () => {
    let actions;
    let queryModels;
    const TEST_SCHEMA = 'testSchema';
    const TEST_QUERY = 'testQuery';

    const DEFAULT_PROPS = (): PrintModalProps & InjectedQueryModels => {
        return {
            defaultLabel: undefined,
            api: getTestAPIWrapper(),
            sampleIds: [],
            showSelection: true,
            printServiceUrl: 'test',
            queryModels,
            actions,
            model: queryModels.sampleModel,
        };
    };

    beforeAll(() => {
        actions = makeTestActions();
        queryModels = {
            sampleModel: makeTestQueryModel(new SchemaQuery(TEST_SCHEMA, TEST_QUERY), new QueryInfo({})).mutate({
                queryInfoLoadingState: LoadingState.LOADED,
                rowsLoadingState: LoadingState.LOADED,
            }),
            singleSampleModel: makeTestQueryModel(new SchemaQuery(TEST_SCHEMA, TEST_QUERY), new QueryInfo({})).mutate({
                queryInfoLoadingState: LoadingState.LOADED,
                rowsLoadingState: LoadingState.LOADED,
            }),
        };
    });

    test('no selections', async () => {
        await act(async () => {
            renderWithAppContext(
                <PrintLabelsModalImpl {...DEFAULT_PROPS()} />
            );
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Print Labels with BarTender');
        expect(document.getElementsByClassName('select-input-container')).toHaveLength(2);
        expect(document.querySelector('.modal-body').textContent).toContain('Select samples to print labels for.');
        expect(document.querySelector('.btn-success').getAttribute('disabled')).toBe('');
    });

    test('single sample with selection', async () => {
        await act(async () => {
            renderWithAppContext(
                <PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1']} defaultLabel={0} />
            );
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Print Labels for 1 Sample with BarTender');
        expect(document.getElementsByClassName('select-input-container')).toHaveLength(2);
        expect(document.querySelector('.modal-body').textContent).toContain('Confirm you\'ve selected the samples you want and the proper label template.');
        expect(document.querySelector('.btn-success').getAttribute('disabled')).toBeNull();
    });

    test('single sample without selection', async () => {
        await act(async () => {
            renderWithAppContext(
                <PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1']} showSelection={false} defaultLabel={0} />
            );
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Print Labels for 1 Sample with BarTender');
        expect(document.getElementsByClassName('select-input-container')).toHaveLength(1);
        expect(document.querySelector('.modal-body').textContent).toContain('Choose the number of copies of the label for this sample');
        expect(document.querySelector('.btn-success').getAttribute('disabled')).toBeNull();
    });

    test('multiple labels', async () => {
        await act(async () => {
            renderWithAppContext(
                <PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1', '2', '3']} defaultLabel={0} />
            );
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Print Labels for 3 Samples with BarTender');
        expect(document.getElementsByClassName('select-input-container')).toHaveLength(2);
        expect(document.querySelector('.modal-body').textContent).toContain('Confirm you\'ve selected the samples you want and the proper label template.');
        expect(document.querySelector('.btn-success').getAttribute('disabled')).toBeNull();
    });

    test('no label template', async () => {
        await act(async () => {
            renderWithAppContext(
                <PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1', '2', '3']} />
            );
        });
        expect(document.querySelector('.btn-success').getAttribute('disabled')).toBe('');
    });

});
