import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { PageMenu } from './PageMenu';

type PageMenuWrapper = ReactWrapper<Readonly<PageMenu['props']>, Readonly<PageMenu['state']>, PageMenu>;

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
        };
    });

    const expectMenuItems = (
        wrapper: PageMenuWrapper,
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
        const wrapper = mount<PageMenu>(<PageMenu {...props} />);
        expectMenuItems(wrapper, false, false, false, '2', '34 Total Pages');

        wrapper.setProps({ disabled: true });
        expectMenuItems(wrapper, true, true, true, '2', '...');

        wrapper.setProps({ disabled: false, currentPage: 1, isFirstPage: true });
        expectMenuItems(wrapper, false, true, false, '1', '34 Total Pages');

        wrapper.setProps({ disabled: false, currentPage: 34, isFirstPage: false, isLastPage: true });
        expectMenuItems(wrapper, false, false, true, '34', '34 Total Pages');
    });

    test('interactions', () => {
        const wrapper = mount<PageMenu>(<PageMenu {...props} />);
        wrapper.find('MenuItem').at(1).find('a').simulate('click');
        expect(props.loadFirstPage).toHaveBeenCalled();
        wrapper.find('MenuItem').at(2).find('a').simulate('click');
        expect(props.loadLastPage).toHaveBeenCalled();
    });
});
