import React from 'react';
import { ReactWrapper } from 'enzyme';
import { fromJS } from 'immutable';
import { Button, SplitButton } from 'react-bootstrap';

import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { AssayStateModel } from '../assay/models';
import { AssayDefinitionModel } from '../../AssayDefinitionModel';
import { LoadingState } from '../../../public/LoadingState';

import { SampleAssayDetailButtons, SampleAssayDetailButtonsRight } from './SampleAssayDetail';
import { mountWithServerContext } from '../../testHelpers';
import { TEST_USER_AUTHOR, TEST_USER_READER } from '../../../test/data/users';
import { SampleAliquotViewSelector } from './SampleAliquotViewSelector';

const assayModel = new AssayStateModel({
    definitions: [
        new AssayDefinitionModel({ id: 17, name: 'First Assay', type: 'General', links: fromJS({ 'import': 'test1' }) }),
        new AssayDefinitionModel({ id: 41, name: 'NAb Assay', type: 'NAb', links: fromJS({ 'import': 'test2' }) }),
    ],
    definitionsLoadingState: LoadingState.LOADED,
});
const sampleModel = makeTestQueryModel(SchemaQuery.create('schema', 'query'));
const model = makeTestQueryModel(SchemaQuery.create('schema', 'query')).mutate({ title: 'First Assay' });
const DEFAULT_PROPS = {
    assayModel,
    sampleModel,
    model,
    actions: makeTestActions(),
};

describe('SampleAssayDetailButtons', () => {
    function validate(wrapper: ReactWrapper, buttonCount = 0): void {
        expect(wrapper.find(SplitButton)).toHaveLength(buttonCount > 1 ? 1 : 0);
        expect(wrapper.find(Button)).toHaveLength(buttonCount);
    }

    test('without insert perm', () => {
        const wrapper = mountWithServerContext(
            <SampleAssayDetailButtons {...DEFAULT_PROPS} />,
            { user: TEST_USER_READER }
        );
        validate(wrapper);
        wrapper.unmount();
    });

    test('currentAssayHref undefined', () => {
        const model = makeTestQueryModel(SchemaQuery.create('schema', 'query')).mutate({ title: 'Other Assay' });
        const wrapper = mountWithServerContext(
            <SampleAssayDetailButtons {...DEFAULT_PROPS} model={model} />,
            { user: TEST_USER_AUTHOR }
        );
        validate(wrapper);
        wrapper.unmount();
    });

    test('multiple menu items', () => {
        const model = makeTestQueryModel(SchemaQuery.create('schema', 'query')).mutate({ title: 'NAb Assay' });
        const wrapper = mountWithServerContext(
            <SampleAssayDetailButtons {...DEFAULT_PROPS} model={model} />,
            { user: TEST_USER_AUTHOR }
        );
        validate(wrapper, 2);
        expect(wrapper.find(SplitButton).prop('href')).toBe('test2');
        wrapper.unmount();
    });

    test('one menu item', () => {
        const assayModel = new AssayStateModel({
            definitions: [
                new AssayDefinitionModel({ id: 17, name: 'First Assay', type: 'General', links: fromJS({ 'import': 'test1' }) }),
            ],
            definitionsLoadingState: LoadingState.LOADED,
        });

        const wrapper = mountWithServerContext(
            <SampleAssayDetailButtons {...DEFAULT_PROPS} assayModel={assayModel} />,
            { user: TEST_USER_AUTHOR }
        );
        validate(wrapper, 1);
        expect(wrapper.find(Button).prop('href')).toBe('test1');
        wrapper.unmount();
    });
});

describe('SampleAssayDetailButtonsRight', () => {
    test('isSourceSampleAssayGrid false', () => {
        const wrapper = mountWithServerContext(
            <SampleAssayDetailButtonsRight {...DEFAULT_PROPS} isSourceSampleAssayGrid={false} />,
            { user: TEST_USER_READER }
        );
        expect(wrapper.find(SampleAliquotViewSelector)).toHaveLength(1);
        expect(wrapper.find(SampleAliquotViewSelector).prop('headerLabel')).toBe('Show Assay Data with Samples');
        expect(wrapper.find(SampleAliquotViewSelector).prop('samplesLabel')).toBe('Sample Only');
        expect(wrapper.find(SampleAliquotViewSelector).prop('allLabel')).toBe('Sample or Aliquots');
        wrapper.unmount();
    });

    test('isSourceSampleAssayGrid true', () => {
        const wrapper = mountWithServerContext(
            <SampleAssayDetailButtonsRight {...DEFAULT_PROPS} isSourceSampleAssayGrid={true} />,
            { user: TEST_USER_READER }
        );
        expect(wrapper.find(SampleAliquotViewSelector)).toHaveLength(1);
        expect(wrapper.find(SampleAliquotViewSelector).prop('headerLabel')).toBe('Show Assay Data with Source Samples');
        expect(wrapper.find(SampleAliquotViewSelector).prop('samplesLabel')).toBe('Derived Samples Only');
        expect(wrapper.find(SampleAliquotViewSelector).prop('allLabel')).toBe('Derived Samples or Aliquots');
        wrapper.unmount();
    });
});
