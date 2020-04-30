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
import { mount, shallow } from 'enzyme';

import { PaginationButtons } from './PaginationButtons';
// We use mount instead of shallow because there is a bug in enzyme where simulating clicks with shallow is broken:
// https://github.com/airbnb/enzyme/issues/386

const noop = () => {};
const prevSelector = '.pagination-buttons__prev';
const nextSelector = '.pagination-buttons__next';

describe('<PaginationButtons />', () => {
    test('Render with properties', () => {
        const tree = renderer
            .create(<PaginationButtons total={60} currentPage={1} perPage={20} previousPage={noop} nextPage={noop} />)
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('Render first page', () => {
        const prev = jest.fn();
        const next = jest.fn();
        const component = (
            <PaginationButtons total={60} currentPage={0} perPage={20} previousPage={prev} nextPage={next} />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();

        const wrapper = mount(component);
        wrapper.find(prevSelector).hostNodes().simulate('click');
        expect(prev).toHaveBeenCalledTimes(0);
        wrapper.find(nextSelector).hostNodes().simulate('click');
        expect(next).toHaveBeenCalledTimes(1);
    });

    test('Render last page', () => {
        const prev = jest.fn();
        const next = jest.fn();
        const component = (
            <PaginationButtons total={60} currentPage={2} perPage={20} previousPage={prev} nextPage={next} />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();

        const wrapper = mount(component);
        wrapper.find(prevSelector).hostNodes().simulate('click');
        expect(prev).toHaveBeenCalledTimes(1);
        wrapper.find(nextSelector).hostNodes().simulate('click');
        expect(next).toHaveBeenCalledTimes(0);
    });

    test('Render only page', () => {
        const prev = jest.fn();
        const next = jest.fn();
        const component = (
            <PaginationButtons total={10} currentPage={0} perPage={20} previousPage={prev} nextPage={next} />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();

        const wrapper = mount(component);
        wrapper.find(prevSelector).hostNodes().simulate('click');
        expect(prev).toHaveBeenCalledTimes(0);
        wrapper.find(nextSelector).hostNodes().simulate('click');
        expect(next).toHaveBeenCalledTimes(0);
    });

    test('Render last page with less items than perPage', () => {
        const tree = renderer
            .create(<PaginationButtons total={63} currentPage={3} perPage={20} previousPage={noop} nextPage={noop} />)
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('Hide counts with invalid data', () => {
        const prev = jest.fn();
        const next = jest.fn();
        const component = (
            <PaginationButtons total={0} currentPage={1} perPage={20} previousPage={prev} nextPage={next} />
        );
        const wrapper = shallow(component);
        expect(wrapper.find('.pagination-buttons__info').text()).toEqual('');
    });
});
