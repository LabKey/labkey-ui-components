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

import { shallow } from 'enzyme';

import { AddEntityButton } from './AddEntityButton';

describe('<AddEntityButton />', () => {
    test('Default properties', () => {
        const onClick = jest.fn();
        const wrapper = shallow(<AddEntityButton onClick={onClick} />);
        wrapper.find('span').simulate('click');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(wrapper).toMatchSnapshot();
    });

    test('Specify entity and classes', () => {
        const onClick = jest.fn();
        const tree = renderer
            .create(
                <AddEntityButton
                    entity="Test"
                    onClick={onClick}
                    containerClass="test-container-class"
                    buttonClass="test-button-class"
                />
            )
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('Disabled', () => {
        const onClick = jest.fn();
        const wrapper = shallow(<AddEntityButton disabled={true} onClick={onClick} />);
        wrapper.find('span').simulate('click');
        expect(onClick).toHaveBeenCalledTimes(0);
        expect(wrapper).toMatchSnapshot();
    });

    test('With title', () => {
        const onClick = jest.fn();
        const tree = renderer.create(<AddEntityButton entity="Test" onClick={onClick} title="Test title" />).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
