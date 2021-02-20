/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';
import { fromJS } from 'immutable';

import { getStateQueryGridModel } from '../../../models';
import { getQueryGridModel } from '../../../global';

import sampleDetailsQuery from '../../../../test/data/sampleDetails-getQuery.json';
import { initUnitTestMocks } from '../../../testHelperMocks';
import { gridInit, SCHEMAS, SchemaQuery } from '../../../..';

import { DetailEditing } from './DetailEditing';

let MODEL_ID;

beforeAll(() => {
    initUnitTestMocks(
        fromJS({
            schema: {
                [SCHEMAS.SAMPLE_SETS.SCHEMA]: {
                    queryDefaults: {
                        appEditableTable: true,
                    },
                },
            },
        })
    );

    const schemaQuery = SchemaQuery.create('samples', 'Samples');
    const model = getStateQueryGridModel('jest-querygridmodel', schemaQuery, {
        allowSelection: false,
        loader: {
            fetch: () => {
                const data = fromJS(sampleDetailsQuery.rows[0]);

                return new Promise(resolve => {
                    resolve({
                        data,
                        dataIds: data.keySeq().toList(),
                    });
                });
            },
        },
    });
    gridInit(model);

    MODEL_ID = model.getId();
});

const editBtnSelector = '.detail__edit-button';
const headingSelector = '.detail__edit--heading';

describe('<DetailEditing/>', () => {
    test('loading', () => {
        const model = getStateQueryGridModel('jest-querygridmodel-loading', SchemaQuery.create('samples', 'Samples'));
        const component = <DetailEditing queryModel={model} canUpdate={true} />;
        const tree = renderer.create(component);

        expect(tree).toMatchSnapshot();
    });

    test('canUpdate false', () => {
        const model = getQueryGridModel(MODEL_ID);
        const component = <DetailEditing queryModel={model} canUpdate={false} />;
        const tree = renderer.create(component);

        expect(tree).toMatchSnapshot();

        const wrapper = mount(component);
        expect(wrapper.find(editBtnSelector)).toHaveLength(0);
        wrapper.unmount();
    });

    test('canUpdate true', () => {
        const model = getQueryGridModel(MODEL_ID);
        const component = <DetailEditing queryModel={model} canUpdate={true} />;
        const tree = renderer.create(component);

        expect(tree).toMatchSnapshot();

        const wrapper = mount(component);
        expect(wrapper.find(headingSelector).text()).toBe('Details');

        // find edit button and click it to make sure form renders
        const editButton = wrapper.find(editBtnSelector);
        expect(editButton).toHaveLength(1);
        expect(editButton.find('i')).toHaveLength(1);
        editButton.hostNodes().simulate('click');
        expect(wrapper.find(headingSelector).text()).toBe('Editing Details');
        expect(wrapper.find('.form-group')).toHaveLength(6);

        // find the save button and click it
        expect(wrapper.find('.edit__warning')).toHaveLength(0);
        const saveButton = wrapper.find('.btn-success');
        expect(saveButton).toHaveLength(1);
        saveButton.first().hostNodes().simulate('click');

        wrapper.unmount();
    });

    test('useEditIcon false', () => {
        const model = getQueryGridModel(MODEL_ID);
        const component = <DetailEditing queryModel={model} canUpdate={true} useEditIcon={false} />;
        const wrapper = mount(component);
        // find edit button and make sure it isn't an icon
        const editButton = wrapper.find(editBtnSelector);
        expect(editButton.find('i')).toHaveLength(0);
        expect(editButton.text()).toBe('Edit');

        wrapper.unmount();
    });

    test('custom title and buttons', () => {
        const model = getQueryGridModel(MODEL_ID);
        const panelTitleText = 'Override Title';
        const submitText = 'Override Save';
        const cancelText = 'Override Cancel';
        const component = (
            <DetailEditing
                queryModel={model}
                canUpdate={true}
                title={panelTitleText}
                useEditIcon={true}
                submitText={submitText}
                cancelText={cancelText}
            />
        );

        const wrapper = mount(component);
        const panelTitle = wrapper.find(headingSelector);
        expect(panelTitle.text()).toBe(panelTitleText);

        const editButton = wrapper.find(editBtnSelector);
        editButton.hostNodes().simulate('click');
        expect(wrapper.find(headingSelector).text()).toBe('Editing ' + panelTitleText);

        const cancelButton = wrapper.find('.btn-default');
        expect(cancelButton.text()).toBe(cancelText);

        const saveButton = wrapper.find('.btn-success');
        expect(saveButton.text()).toBe(submitText);

        wrapper.unmount();
    });
});
