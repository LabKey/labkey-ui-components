import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { PageMenu } from './PageMenu';

describe('PageMenu', () => {
    let props;
    beforeEach(() => {
        props = {
            id: 'model',
            currentPage: 2,
            disabled: false,
            isFirstPage: false,
            isLastPage: false,
            loadFirstPage: jest.fn(),
            loadLastPage: jest.fn(),
            pageCount: 34,
            showPageSizeMenu: false,
            pageSize: 20,
            pageSizes: [20, 40, 100, 250, 400],
            setPageSize: jest.fn(),
        };
    });

    const expectPageMenuItems = (
        wrapper: ReactWrapper,
        menuDisabled: boolean,
        firstDisabled: boolean,
        lastDisabled: boolean,
        page: string,
        pageCount: string
    ): void => {
        const menuButton = wrapper.find('button.dropdown-toggle');
        expect(menuButton.props().disabled).toEqual(menuDisabled);
        expect(menuButton.text()).toEqual(page + ' '); // there is a space then a caret
        const menuItems = wrapper.find('li');
        expect(menuItems.at(1).hasClass('disabled')).toEqual(firstDisabled);
        expect(menuItems.at(2).hasClass('disabled')).toEqual(lastDisabled);
        expect(menuItems.at(3).text()).toEqual(pageCount);
    };

    test('render', () => {
        const wrapper = mount(<PageMenu {...props} />);
        expectPageMenuItems(wrapper, false, false, false, '2', '34 Total Pages');

        wrapper.setProps({ disabled: true });
        expectPageMenuItems(wrapper, true, true, true, '2', '...');

        wrapper.setProps({ disabled: false, currentPage: 1, isFirstPage: true });
        expectPageMenuItems(wrapper, false, true, false, '1', '34 Total Pages');

        wrapper.setProps({ disabled: false, currentPage: 34, isFirstPage: false, isLastPage: true });
        expectPageMenuItems(wrapper, false, false, true, '34', '34 Total Pages');

        wrapper.unmount();
    });

    test('interactions', () => {
        const wrapper = mount(<PageMenu {...props} />);
        wrapper.find('MenuItem').at(1).find('a').simulate('click');
        expect(props.loadFirstPage).toHaveBeenCalled();
        wrapper.find('MenuItem').at(2).find('a').simulate('click');
        expect(props.loadLastPage).toHaveBeenCalled();
        wrapper.unmount();
    });

    test('showPageSizeMenu', () => {
        const wrapper = mount(<PageMenu {...props} showPageSizeMenu />);
        const menuItems = wrapper.find('MenuItem');
        expect(menuItems).toHaveLength(11);
        // page size menu items start with header at index 5
        expect(menuItems.at(5).text()).toBe('Page Size');
        expect(menuItems.at(6).text()).toBe('20');
        expect(menuItems.at(6).prop('active')).toBeTruthy();
        expect(menuItems.at(10).text()).toBe('400');
        expect(menuItems.at(10).prop('active')).toBeFalsy();
        wrapper.unmount();
    });
});
