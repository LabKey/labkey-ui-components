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

import { RemoveEntityButton } from './RemoveEntityButton';

describe('<RemoveEntityButton />', () => {
    test('Default properties', () => {
        const onClick = jest.fn();
        const wrapper = shallow(<RemoveEntityButton onClick={onClick} />);
        wrapper.find('span').simulate('click');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(wrapper).toMatchSnapshot();
    });

    test('Specify entity without index', () => {
        const onClick = jest.fn();
        const tree = renderer.create(<RemoveEntityButton entity="Test" onClick={onClick} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('Specify label class, index, and entity', () => {
        const onClick = jest.fn();
        const tree = renderer
            .create(<RemoveEntityButton entity="Test" onClick={onClick} labelClass="test-label-class" index={3} />)
            .toJSON();
        expect(tree).toMatchSnapshot();
    });
});
