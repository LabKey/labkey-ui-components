import React from 'react';
import { mount } from 'enzyme';

import { Pagination, PaginationProps } from './Pagination';

describe('Pagination', () => {
    let props: PaginationProps;
    beforeEach(() => {
        props = {
            disabled: false,
            id: 'model',
            currentPage: 1,
            isFirstPage: true,
            isLastPage: false,
            offset: 0,
            pageCount: 34,
            pageSize: 20,
            rowCount: 661,
            loadFirstPage: jest.fn(),
            loadLastPage: jest.fn(),
            loadNextPage: jest.fn(),
            loadPreviousPage: jest.fn(),
            setPageSize: jest.fn(),
        };
    });

    test('render', () => {
        // Previous page button should be disabled
        const wrapper = mount<Pagination>(<Pagination {...props} />);
        // Previous button is first
        expect(wrapper.find('button.btn').first().props().disabled).toEqual(true);
        // Next Page Button is at 2
        expect(wrapper.find('button.btn').at(2).props().disabled).toEqual(false);

        // Next page button should be disabled
        wrapper.setProps({ isFirstPage: false, isLastPage: true });
        expect(wrapper.find('button.btn').first().props().disabled).toEqual(false);
        expect(wrapper.find('button.btn').at(2).props().disabled).toEqual(true);

        // Everything should be disabled.
        wrapper.setProps({ disabled: true, isFirstPage: false, isLastPage: false });
        expect(wrapper.find('button.btn').first().props().disabled).toEqual(true);
        expect(wrapper.find('button.btn').at(2).props().disabled).toEqual(true);
        // PageSizeMenu is last button
        expect(wrapper.find('button.btn').last().props().disabled).toEqual(true);

        // PageSizeMenu should be hidden.
        wrapper.setProps({ disabled: false, rowCount: 5 });
        expect(wrapper.find('.page-size-menu').exists()).toEqual(false);

        wrapper.setProps({ rowCount: 661 });
        expect(wrapper.find('.pagination-info').text()).toEqual('1 - 20 of 661');

        wrapper.setProps({ pageSize: 40 });
        expect(wrapper.find('.pagination-info').text()).toEqual('1 - 40 of 661');

        wrapper.setProps({ pageSize: 20, offset: 20 });
        expect(wrapper.find('.pagination-info').text()).toEqual('21 - 40 of 661');

        wrapper.setProps({ pageSize: 20, offset: 0, rowCount: 10 });
        expect(wrapper.find('.pagination-info').text()).toEqual('1 - 10');
    });

    test('interactions', () => {
        // Note: we only test next/previous buttons here because the menu components have their own interaction tests.
        const { loadNextPage, loadPreviousPage } = props;
        const wrapper = mount<Pagination>(<Pagination {...props} />);
        wrapper.find('button.btn').first().simulate('click');
        expect(loadPreviousPage).not.toHaveBeenCalled();
        wrapper.find('button.btn').at(2).simulate('click');
        expect(loadNextPage).toHaveBeenCalled();

        (loadNextPage as jest.Mock).mockClear();
        (loadPreviousPage as jest.Mock).mockClear();
        wrapper.setProps({ isFirstPage: false });
        wrapper.find('button.btn').first().simulate('click');
        expect(loadPreviousPage).toHaveBeenCalled();
        wrapper.find('button.btn').at(2).simulate('click');
        expect(loadNextPage).toHaveBeenCalled();

        (loadNextPage as jest.Mock).mockClear();
        (loadPreviousPage as jest.Mock).mockClear();
        wrapper.setProps({ isLastPage: true });
        wrapper.find('button.btn').first().simulate('click');
        expect(loadPreviousPage).toHaveBeenCalled();
        wrapper.find('button.btn').at(2).simulate('click');
        expect(loadNextPage).not.toHaveBeenCalled();
    });
});
