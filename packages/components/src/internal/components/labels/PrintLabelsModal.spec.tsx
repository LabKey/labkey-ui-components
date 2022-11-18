import React from 'react';
import { Button, ModalTitle } from 'react-bootstrap';
import { mount } from 'enzyme';

import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { LoadingState } from '../../../public/LoadingState';
import { SelectInput } from '../forms/input/SelectInput';
import { Alert } from '../base/Alert';

import { QueryInfo } from '../../../public/QueryInfo';
import { PrintLabelsModalImpl } from './PrintLabelsModal';

describe('<PrintLabelsModal/>', () => {
    let actions;
    let queryModels;
    const TEST_SCHEMA = 'testSchema';
    const TEST_QUERY = 'testQuery';

    beforeAll(() => {
        actions = makeTestActions();
        queryModels = {
            'sampleModel': makeTestQueryModel(SchemaQuery.create(TEST_SCHEMA, TEST_QUERY), QueryInfo.create({}))
                queryInfoLoadingState: LoadingState.LOADED,
                rowsLoadingState: LoadingState.LOADED,
            }),
            'singleSampleModel': makeTestQueryModel(SchemaQuery.create(TEST_SCHEMA, TEST_QUERY), QueryInfo.create({}))
            ).mutate({ queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED }),
        };
    });

    test('no selections', () => {
        const wrapper = mount(
            <PrintLabelsModalImpl
                show={true}
                schemaName={TEST_SCHEMA}
                queryName={TEST_QUERY}
                sampleIds={[]}
                showSelection={true}
                labelTemplate="testTemplate"
                printServiceUrl="test"
                queryModels={queryModels}
                actions={actions}
            />
        );

        expect(wrapper.find(ModalTitle).text()).toBe('Print Labels with BarTender');
        expect(wrapper.find(SelectInput)).toHaveLength(1);
        expect(wrapper.find('div.modal-body').text()).toContain('Select samples to print labels for.');
        expect(wrapper.find(Button).prop('disabled')).toBe(true);

        wrapper.unmount();
    });

    test('single sample with selection', () => {
        const wrapper = mount(
            <PrintLabelsModalImpl
                show={true}
                schemaName={TEST_SCHEMA}
                queryName={TEST_QUERY}
                sampleIds={['1']}
                showSelection={true}
                labelTemplate="testTemplate"
                printServiceUrl="test"
                queryModels={queryModels}
                actions={actions}
            />
        );

        expect(wrapper.find(ModalTitle).text()).toBe('Print Labels for 1 Sample with BarTender');
        expect(wrapper.find(SelectInput)).toHaveLength(1);
        expect(wrapper.find('div.modal-body').text()).toContain(
            "Confirm you've selected the samples you want and the proper label template."
        );
        expect(wrapper.find(Button).prop('disabled')).toBe(false);

        wrapper.unmount();
    });

    test('single sample without selection', () => {
        const wrapper = mount(
            <PrintLabelsModalImpl
                show={true}
                schemaName={TEST_SCHEMA}
                queryName={TEST_QUERY}
                sampleIds={['1']}
                showSelection={false}
                labelTemplate="testTemplate"
                printServiceUrl="test"
                queryModels={queryModels}
                actions={actions}
            />
        );

        expect(wrapper.find(ModalTitle).text()).toBe('Print Labels for 1 Sample with BarTender');
        expect(wrapper.find(SelectInput)).toHaveLength(0);
        expect(wrapper.find('div.modal-body').text()).toContain(
            'Choose the number of copies of the label for this sample'
        );
        expect(wrapper.find(Button).prop('disabled')).toBe(false);

        wrapper.unmount();
    });

    test('multiple labels', () => {
        const wrapper = mount(
            <PrintLabelsModalImpl
                show={true}
                schemaName={TEST_SCHEMA}
                queryName={TEST_QUERY}
                sampleIds={['1', '2', '3']}
                showSelection={true}
                labelTemplate="testTemplate"
                printServiceUrl="testUrl"
                queryModels={queryModels}
                actions={actions}
            />
        );

        expect(wrapper.find(ModalTitle).text()).toBe('Print Labels for 3 Samples with BarTender');
        expect(wrapper.find(SelectInput)).toHaveLength(1);
        expect(wrapper.find('div.modal-body').text()).toContain(
            "Confirm you've selected the samples you want and the proper label template."
        );
        expect(wrapper.find(Button).prop('disabled')).toBe(false);
    });

    test('no label template', () => {
        const wrapper = mount(
            <PrintLabelsModalImpl
                show={true}
                schemaName={TEST_SCHEMA}
                queryName={TEST_QUERY}
                sampleIds={['1', '2', '3']}
                showSelection={true}
                labelTemplate={undefined}
                printServiceUrl="testUrl"
                queryModels={queryModels}
                actions={actions}
            />
        );
        expect(wrapper.find(Button).prop('disabled')).toBe(true);
    });

    test('no copy count', () => {
        const wrapper = mount(
            <PrintLabelsModalImpl
                show={true}
                schemaName={TEST_SCHEMA}
                queryName={TEST_QUERY}
                sampleIds={['1', '2', '3']}
                showSelection={true}
                labelTemplate="testTemplate"
                printServiceUrl="testUrl"
                queryModels={queryModels}
                actions={actions}
            />
        );
        wrapper.setState({ numCopies: undefined });
        expect(wrapper.find(Button).prop('disabled')).toBe(true);
    });

    test('submitting', () => {
        const wrapper = mount(
            <PrintLabelsModalImpl
                show={true}
                schemaName={TEST_SCHEMA}
                queryName={TEST_QUERY}
                sampleIds={['1', '2', '3']}
                showSelection={true}
                labelTemplate="testTemplate"
                printServiceUrl="testUrl"
                queryModels={queryModels}
                actions={actions}
            />
        );
        wrapper.setState({ submitting: true });
        expect(wrapper.find(Button).prop('disabled')).toBe(true);
    });

    test('error', () => {
        const wrapper = mount(
            <PrintLabelsModalImpl
                show={true}
                schemaName="test"
                queryName="test"
                sampleIds={[]}
                showSelection={true}
                labelTemplate="testTemplate"
                printServiceUrl="test"
                queryModels={queryModels}
                actions={actions}
            />
        );
        wrapper.setState({ error: "We've got a problem" });
        const alert = wrapper.find(Alert);
        expect(alert).toHaveLength(1);
        expect(alert.text()).toBe("We've got a problem");
        wrapper.unmount();
    });
});
