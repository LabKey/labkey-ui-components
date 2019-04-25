import * as React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';
// We use mount instead of shallow because there is a bug in enzyme where simulating clicks with shallow is broken:
// https://github.com/airbnb/enzyme/issues/386

import { PaginationButtons } from './PaginationButtons';

const noop = () => {};
// Note: if we change the selector to just .pagination-buttons__prev then wrapper.find returns two items, even though
// the snapshot proves there is only one item with this class. If you use the debugger and call wrapper.html() it
// also only has one matching element in the HTML returned. Enzyme docs indicate that the behavior I am seeing is wrong.
const prevSelector = 'button.pagination-buttons__prev';
const nextSelector = 'button.pagination-buttons__next';

describe("<PaginationButtons />", () => {
    test("Render without properties", () => {
        const tree = renderer.create(<PaginationButtons />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("Render with properties", () => {
        const tree = renderer.create((
            <PaginationButtons total={60} currentPage={1} perPage={20} previousPage={noop} nextPage={noop}/>
        )).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("Render first page", () => {
        const prev = jest.fn();
        const next = jest.fn();
        const component = (
            <PaginationButtons total={60} currentPage={0} perPage={20} previousPage={prev} nextPage={next}/>
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();

        const wrapper = mount(component);
        wrapper.find(prevSelector).simulate('click');
        expect(prev).toHaveBeenCalledTimes(0);
        wrapper.find(nextSelector).simulate('click');
        expect(next).toHaveBeenCalledTimes(1);
    });

    test("Render last page", () => {
        const prev = jest.fn();
        const next = jest.fn();
        const component = (
            <PaginationButtons total={60} currentPage={2} perPage={20} previousPage={prev} nextPage={next}/>
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();

        const wrapper = mount(component);
        wrapper.find(prevSelector).simulate('click');
        expect(prev).toHaveBeenCalledTimes(1);
        wrapper.find(nextSelector).simulate('click');
        expect(next).toHaveBeenCalledTimes(0);
    });

    test("Render only page", () => {
        const prev = jest.fn();
        const next = jest.fn();
        const component = (
            <PaginationButtons total={10} currentPage={0} perPage={20} previousPage={prev} nextPage={next}/>
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();

        const wrapper = mount(component);
        wrapper.find(prevSelector).simulate('click');
        expect(prev).toHaveBeenCalledTimes(0);
        wrapper.find(nextSelector).simulate('click');
        expect(next).toHaveBeenCalledTimes(0);
    });

    test("Render last page with less items than perPage", () => {
        const tree = renderer.create((
            <PaginationButtons total={63} currentPage={3} perPage={20} previousPage={noop} nextPage={noop}/>
        )).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
