import React from 'react';

import { mount } from 'enzyme';

import { Alert } from 'react-bootstrap';

import { LoadingState } from '../../../public/LoadingState';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';
import { FindByIdsModal } from '../navigation/FindByIdsModal';
import { LoadingSpinner } from '../base/LoadingSpinner';

import {
    FindSamplesByIdHeaderPanel,
    getFindIdCountsByTypeMessage,
    SamplesNotFoundMsg
} from './FindSamplesByIdHeaderPanel';
import { SAMPLE_ID_FIND_FIELD, UNIQUE_ID_FIND_FIELD } from './constants';

describe('getFindIdCountsByTypeMessage', () => {

    test('no data', () => {
        expect(getFindIdCountsByTypeMessage([])).toBeFalsy();
        expect(getFindIdCountsByTypeMessage(undefined)).toBeFalsy();
    });

    test('data but with unknown prefix', () => {
        expect(getFindIdCountsByTypeMessage(['x:id1', 'y:id2'])).toBeFalsy();
    });

    test('one sampleId', () => {
        expect(getFindIdCountsByTypeMessage(['s:S-1'])).toBe('1 Sample ID');
    });

    test('multiple sampleIds', () => {
        expect(getFindIdCountsByTypeMessage(['s:S-1', 's:B-52'])).toBe('2 Sample IDs');
    });

    test('one uniqueId', () => {
        expect(getFindIdCountsByTypeMessage(['u:U-2'])).toBe('1 Barcode');
    });

    test('multiple uniqueId', () => {
        expect(getFindIdCountsByTypeMessage(['u:U-2', 'u:U-3', 'u:0000041', 'u:88'])).toBe('4 Barcodes');
    });

    test('both sampleIds and uniqueIds', () => {
        expect(getFindIdCountsByTypeMessage(['u:U-2', 's:S-3', 'u:B', 'u:0000041', 's:X-88'])).toBe('2 Sample IDs and 3 Barcodes');
    });
});

describe('FindSamplesByIdHeaderPanel', () => {
    test('loading', () => {
        const queryModel = makeTestQueryModel(SchemaQuery.create('test', 'query'));

        const wrapper = mount(
            <FindSamplesByIdHeaderPanel
                loadingState={LoadingState.LOADING}
                listModel={queryModel}
                missingIds={{}}
                onFindSamples={jest.fn()}
                onClearSamples={jest.fn()}
                ids={undefined}
                sessionKey={undefined}
            />
        );
        const section = wrapper.find('Section');
        expect(section.prop('title')).toBe('Find Samples in Bulk');
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        const buttons = wrapper.find('button');
        expect(buttons).toHaveLength(2);
        expect(buttons.at(0).text()).toBe('Add Samples');
        expect(buttons.at(0).prop('disabled')).toBe(false);
        expect(buttons.at(1).text()).toBe('Reset');
        expect(buttons.at(1).prop('disabled')).toBe(true);
        expect(wrapper.find(Alert)).toHaveLength(0);
        expect(wrapper.find('.find-samples-warning')).toHaveLength(0);
    });

    test('no list model', () => {
        const wrapper = mount(
            <FindSamplesByIdHeaderPanel
                loadingState={LoadingState.LOADED}
                listModel={undefined}
                missingIds={{}}
                onFindSamples={jest.fn()}
                onClearSamples={jest.fn()}
                ids={['u:U-2']}
                sessionKey={'test'}
            />
        );
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find('.find-samples-success')).toHaveLength(0);
        const buttons = wrapper.find('button');
        expect(buttons).toHaveLength(2);
        expect(buttons.at(0).text()).toBe('Add Samples');
    });

    test('list model loading', () => {
        const queryModel = makeTestQueryModel(SchemaQuery.create('test', 'query'));

        const wrapper = mount(
            <FindSamplesByIdHeaderPanel
                loadingState={LoadingState.LOADED}
                listModel={queryModel}
                missingIds={{}}
                onFindSamples={jest.fn()}
                onClearSamples={jest.fn()}
                ids={['u:U-2']}
                sessionKey={'test'}
            />
        );
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
    });

    test('no ids', () => {
        const queryModel = makeTestQueryModel(SchemaQuery.create('test', 'query'), new QueryInfo(), {}, [], 0);

        const wrapper = mount(
            <FindSamplesByIdHeaderPanel
                loadingState={LoadingState.LOADED}
                listModel={queryModel}
                missingIds={{}}
                onFindSamples={jest.fn()}
                onClearSamples={jest.fn()}
                ids={[]}
                sessionKey={'test'}
            />
        );
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find('.find-samples-success')).toHaveLength(0);
        expect(wrapper.find(Alert)).toHaveLength(0);
        expect(wrapper.find('button').at(0).text()).toBe('Add Samples');
        expect(wrapper.find('.find-samples-warning')).toHaveLength(0);
    });

    test('with error', () => {
        const queryModel = makeTestQueryModel(SchemaQuery.create('test', 'query'), new QueryInfo(), {}, [], 0);

        const wrapper = mount(
            <FindSamplesByIdHeaderPanel
                loadingState={LoadingState.LOADED}
                listModel={queryModel}
                missingIds={{}}
                onFindSamples={jest.fn()}
                onClearSamples={jest.fn()}
                error={<div>We have a problem here.</div>}
                ids={[]}
                sessionKey={'test'}
            />
        );

        const alert = wrapper.find(Alert);
        expect(alert).toHaveLength(1);
        expect(alert.text()).toBe('We have a problem here.');
    });

    test('found multiple samples', () => {
        const queryModel = makeTestQueryModel(
            SchemaQuery.create('test', 'query'),
            new QueryInfo(),
            { 1: {}, 2: {} },
            ['1', '2'],
            2
        );
        const wrapper = mount(
            <FindSamplesByIdHeaderPanel
                loadingState={LoadingState.LOADED}
                listModel={queryModel}
                missingIds={{
                    [UNIQUE_ID_FIND_FIELD.label]: ['U-1'],
                    [SAMPLE_ID_FIND_FIELD.label]: ['S-bad', 'Nonesuch'],
                }}
                onFindSamples={jest.fn()}
                onClearSamples={jest.fn()}
                ids={['u:U-2', 's:B-52']}
                sessionKey={'test'}
            />
        );
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        const foundMsg = wrapper.find({ id: 'found-samples-message' });
        expect(foundMsg).toHaveLength(1);
        expect(foundMsg.text()).toBe('Found 2 samples matching 1 Sample ID and 1 Barcode.');

        const buttons = wrapper.find('button');
        expect(buttons.at(0).text()).toBe('Add More Samples');
        expect(buttons.at(1).text()).toBe('Reset');
        expect(buttons.at(1).prop('disabled')).toBe(false);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find('.find-samples-warning')).toHaveLength(1);
        expect(wrapper.find(FindByIdsModal)).toHaveLength(1);
    });
});

describe('SamplesNotFoundMsg', () => {
    test('no missingIds', () => {
        const wrapper = mount(<SamplesNotFoundMsg missingIds={undefined} />);
        expect(wrapper.find('.find-samples-warning')).toHaveLength(0);
        expect(wrapper.find(Alert)).toHaveLength(0);
    });

    test('one empty array', () => {
        const wrapper = mount(
            <SamplesNotFoundMsg
                missingIds={{
                    [UNIQUE_ID_FIND_FIELD.label]: [],
                }}
            />
        );
        expect(wrapper.find('.find-samples-warning')).toHaveLength(0);
        expect(wrapper.find(Alert)).toHaveLength(0);
    });

    test('multiple empty arrays', () => {
        const wrapper = mount(
            <SamplesNotFoundMsg
                missingIds={{
                    [UNIQUE_ID_FIND_FIELD.label]: [],
                    [SAMPLE_ID_FIND_FIELD.label]: [],
                }}
            />
        );
        expect(wrapper.find('.find-samples-warning')).toHaveLength(0);
        expect(wrapper.find(Alert)).toHaveLength(0);
    });

    test('single sample', () => {
        const wrapper = mount(
            <SamplesNotFoundMsg
                missingIds={{
                    [SAMPLE_ID_FIND_FIELD.label]: ['S-1'],
                }}
            />
        );
        const msgDiv = wrapper.find('div');
        expect(msgDiv).toHaveLength(1);
        expect(msgDiv.text()).toContain("Couldn't locate 1 sample.");
        let alert = wrapper.find(Alert);
        expect(alert).toHaveLength(0);
        const toggle = wrapper.find('.find-samples-warning-toggle');
        expect(toggle.text()).toBe('Show all ');
        toggle.simulate('click');
        alert = wrapper.find(Alert);
        expect(alert.text()).toBe('Sample IDs: S-1');
        expect(wrapper.find('.find-samples-warning-toggle').text()).toBe('Hide ');
    });

    test('multiple samples', () => {
        const wrapper = mount(
            <SamplesNotFoundMsg
                missingIds={{
                    'Other IDs': ['O-1', 'O-2'],
                    [SAMPLE_ID_FIND_FIELD.label]: ['S-1'],
                }}
            />
        );
        const msgDiv = wrapper.find('div');
        expect(msgDiv).toHaveLength(1);
        expect(msgDiv.text()).toContain("Couldn't locate 3 samples.");
        const toggle = wrapper.find('.find-samples-warning-toggle');
        expect(toggle.text()).toBe('Show all ');
        toggle.simulate('click');
        const alert = wrapper.find(Alert);
        expect(alert.text()).toContain('Sample IDs: S-1');
        expect(alert.text()).toContain('Other IDs: O-1, O-2');
    });
});
