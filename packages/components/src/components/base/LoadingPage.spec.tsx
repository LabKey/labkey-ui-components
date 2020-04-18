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

import { LoadingPage } from './LoadingPage';
import { PageHeader } from './PageHeader';
import { LoadingSpinner } from './LoadingSpinner';

describe('<LoadingPage/>', () => {
    test('no props', () => {
        const page = shallow(<LoadingPage />);
        // make sure we include a header
        expect(page.find(PageHeader)).toHaveLength(1);
        // add the loading spinner
        expect(page.find(LoadingSpinner)).toHaveLength(1);
        expect(page).toMatchSnapshot();
    });

    test('Custom message and title', () => {
        const tree = renderer.create(<LoadingPage title="Waiting room" msg="Wait here" />).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
