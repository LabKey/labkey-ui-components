import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

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
        };
    });

    test('render', () => {
        // Should render with page count 34
        let tree = renderer.create(<PageMenu {...props} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Should render '...' for pageCount, disabled first/last page MenuItems.
        props.disabled = true;
        tree = renderer.create(<PageMenu {...props} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // First page should be disabled.
        props.disabled = false;
        props.isFirstPage = true;
        expect(tree.toJSON()).toMatchSnapshot();

        // Last page should be disabled
        props.isFirstPage = false;
        props.isLastPage = true;
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('interactions', () => {
        const wrapper = mount<PageMenu>(<PageMenu {...props} />);
        wrapper.find('MenuItem').at(1).find('a').simulate('click');
        expect(props.loadFirstPage).toHaveBeenCalled();
        wrapper.find('MenuItem').at(2).find('a').simulate('click');
        expect(props.loadLastPage).toHaveBeenCalled();
    });
});
