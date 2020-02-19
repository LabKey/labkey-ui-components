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
import { fromJS, Map } from 'immutable';
import { SampleSetDetailsPanel } from './SampleSetDetailsPanel';
import { initUnitTestMocks } from "../../testHelpers";
import { ENTITY_FORM_IDS } from "../domainproperties/entities/constants";

beforeAll(() => {
    initUnitTestMocks();
});

describe("<SampleSetDetailsPanel/>", () => {

    test("default props", (done) => {
        const tree = renderer.create(
            <SampleSetDetailsPanel onCancel={jest.fn()} onComplete={jest.fn()}/>
        );

        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test("nameExpressionInfoUrl", (done) => {
        const tree = renderer.create(
            <SampleSetDetailsPanel onCancel={jest.fn()} onComplete={jest.fn()}
               nameExpressionInfoUrl={'#anything'}
            />
        );

        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test("button clicks", () => {
        const onCompleteFn = jest.fn();
        const onCancelFn = jest.fn();
        const component = (
            <SampleSetDetailsPanel onCancel={onCancelFn} onComplete={onCompleteFn}/>
        );

        const wrapper = mount(component);
        const cancelBtn = wrapper.findWhere(n => n.type() === 'button' && n.text() === 'Cancel');
        const completeBtn = wrapper.findWhere(n => n.type() === 'button' && n.text() === 'Save');
        expect(onCancelFn).toHaveBeenCalledTimes(0);
        expect(onCompleteFn).toHaveBeenCalledTimes(0);

        cancelBtn.simulate('click');
        expect(onCancelFn).toHaveBeenCalledTimes(1);
        expect(onCompleteFn).toHaveBeenCalledTimes(0);

        // try clicking Save button, but it should be disabled because we haven't given the form a valid Name value yet
        expect(completeBtn.getDOMNode().hasAttribute('disabled')).toBeTruthy();
        completeBtn.simulate('click');
        expect(onCancelFn).toHaveBeenCalledTimes(1);
        expect(onCompleteFn).toHaveBeenCalledTimes(0);

        wrapper.unmount();
    });

    test("valid name", () => {
        const component = (
            <SampleSetDetailsPanel onCancel={jest.fn()} onComplete={jest.fn()}/>
        );

        const wrapper = mount(component);

        // Name input should be visible for new sample set
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME)).toHaveLength(1);

        const completeBtn = wrapper.findWhere(n => n.type() === 'button' && n.text() === 'Save');
        expect(completeBtn.getDOMNode().hasAttribute('disabled')).toBeTruthy();

        // simulate Name input value change by updating the component state
        wrapper.setState({formValues: {[ENTITY_FORM_IDS.NAME]: 'test'}});
        expect(completeBtn.getDOMNode().hasAttribute('disabled')).toBeFalsy();

        // change name to empty string and expect button to be disabled again
        wrapper.setState({formValues: {[ENTITY_FORM_IDS.NAME]: ''}});
        expect(completeBtn.getDOMNode().hasAttribute('disabled')).toBeTruthy();

        wrapper.unmount();
    });

    test("existing sample set", () => {
        const nameExpVal = 'S-${genId}';
        const descVal = 'My sample set description.';
        const data = Map<string, any>(fromJS({
            rowId: 1,
            nameExpression: nameExpVal,
            description: descVal
        }));

        const component = (
            <SampleSetDetailsPanel onCancel={jest.fn()} onComplete={jest.fn()}
                data={data}
            />
        );

        const wrapper = mount(component);

        // Name input should not be visible
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME)).toHaveLength(0);

        // Save button should start enabled for existing sample set
        const completeBtn = wrapper.findWhere(n => n.type() === 'button' && n.text() === 'Save');
        expect(completeBtn.getDOMNode().hasAttribute('disabled')).toBeFalsy();

        // Check initial input values
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME_EXPRESSION).props().value).toBe(nameExpVal);
        expect(wrapper.find('textarea#' + ENTITY_FORM_IDS.DESCRIPTION).props().value).toBe(descVal);

        // simulate input value changes by updating the component state
        const updateSuffix = ' UPDATED';
        wrapper.setState({formValues: {
            [ENTITY_FORM_IDS.NAME_EXPRESSION]: nameExpVal + updateSuffix,
            [ENTITY_FORM_IDS.DESCRIPTION]: descVal + updateSuffix
        }});
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME_EXPRESSION).props().value).toBe(nameExpVal + updateSuffix);
        expect(wrapper.find('textarea#' + ENTITY_FORM_IDS.DESCRIPTION).props().value).toBe(descVal + updateSuffix);

        wrapper.unmount();
    });

});
