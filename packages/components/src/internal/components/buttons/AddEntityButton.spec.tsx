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

import { shallow } from 'enzyme';

import { AddEntityButton } from './AddEntityButton';

describe('<AddEntityButton />', () => {
    test('Minimal props', () => {
        const wrapper = shallow(<AddEntityButton entity="EntityName" onClick={jest.fn()} />);
        expect(wrapper).toMatchSnapshot();
    });

    test('Fully populated props', () => {
        const wrapper = shallow(
            <AddEntityButton
                entity="EntityName"
                onClick={jest.fn()}
                buttonClass="test-button-class"
                containerClass="test-container-class"
                disabled={false}
                title="test-title"
                helperTitle="test-helperTitle"
                helperBody={<p> Test Body Contents </p>}
            />
        );
        expect(wrapper).toMatchSnapshot();
    });
});
