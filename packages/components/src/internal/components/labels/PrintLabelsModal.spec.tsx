import React from 'react';
import { shallow } from 'enzyme';

import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { LoadingState } from '../../../public/LoadingState';
import { Alert } from '../base/Alert';

import { QueryInfo } from '../../../public/QueryInfo';

import { waitForLifecycle } from '../../test/enzymeTestHelpers';
import { getTestAPIWrapper } from '../../APIWrapper';
import { InjectedQueryModels } from '../../../public/QueryModel/withQueryModels';
import { QuerySelect } from '../forms/QuerySelect';

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
            show: true,
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

    test('no selections', () => {
        const wrapper = shallow(<PrintLabelsModalImpl {...DEFAULT_PROPS()} />);

        expect(wrapper.find('.modal-title').text()).toBe('Print Labels with BarTender');
        expect(wrapper.find(QuerySelect)).toHaveLength(2);
        expect(wrapper.find('div.modal-body').text()).toContain('Select samples to print labels for.');
        expect(wrapper.find('button').prop('disabled')).toBe(true);
    });

    test('single sample with selection', async () => {
        const wrapper = shallow(<PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1']} />);
        wrapper.setState({ labelTemplate: 0 });
        await waitForLifecycle(wrapper);

        expect(wrapper.find('.modal-title').text()).toBe('Print Labels for 1 Sample with BarTender');
        expect(wrapper.find(QuerySelect)).toHaveLength(2);
        expect(wrapper.find('div.modal-body').text()).toContain(
            "Confirm you've selected the samples you want and the proper label template."
        );
        expect(wrapper.find('button').prop('disabled')).toBe(false);
    });

    test('single sample without selection', async () => {
        const wrapper = shallow(<PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1']} showSelection={false} />);

        wrapper.setState({ labelTemplate: 0 });
        await waitForLifecycle(wrapper);

        expect(wrapper.find('.modal-title').text()).toBe('Print Labels for 1 Sample with BarTender');
        expect(wrapper.find(QuerySelect)).toHaveLength(1);
        expect(wrapper.find('div.modal-body').text()).toContain(
            'Choose the number of copies of the label for this sample'
        );
        expect(wrapper.find('button').prop('disabled')).toBe(false);
    });

    test('multiple labels', async () => {
        const wrapper = shallow(<PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1', '2', '3']} />);

        wrapper.setState({ labelTemplate: 0 });
        await waitForLifecycle(wrapper);

        expect(wrapper.find('.modal-title').text()).toBe('Print Labels for 3 Samples with BarTender');
        expect(wrapper.find(QuerySelect)).toHaveLength(2);
        expect(wrapper.find('div.modal-body').text()).toContain(
            "Confirm you've selected the samples you want and the proper label template."
        );
        expect(wrapper.find('button').prop('disabled')).toBe(false);
    });

    test('no label template', () => {
        const wrapper = shallow(<PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1', '2', '3']} />);
        expect(wrapper.find('button').prop('disabled')).toBe(true);
    });

    test('no copy count', () => {
        const wrapper = shallow(<PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1', '2', '3']} />);
        wrapper.setState({ numCopies: undefined });
        expect(wrapper.find('button').prop('disabled')).toBe(true);
    });

    test('submitting', () => {
        const wrapper = shallow(<PrintLabelsModalImpl {...DEFAULT_PROPS()} sampleIds={['1', '2', '3']} />);
        wrapper.setState({ submitting: true });
        expect(wrapper.find('button').prop('disabled')).toBe(true);
    });

    test('error', async () => {
        const wrapper = shallow(<PrintLabelsModalImpl {...DEFAULT_PROPS()} />);
        // TODO this should use override the print method and test the error handlers...
        wrapper.setState({ error: "We've got a problem" });
        await waitForLifecycle(wrapper);

        const alert = wrapper.find(Alert);
        expect(alert).toHaveLength(1);
    });
});
