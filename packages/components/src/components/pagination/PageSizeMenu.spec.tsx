import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { PageSizeMenu } from './PageSizeMenu';

describe('PageSizeMenu', () => {
    let props;
    beforeEach(() => {
        props = {
            disabled: false,
            id: 'model',
            pageSize: 20,
            pageSizes: [20, 40, 100, 250, 400],
            setPageSize: jest.fn(),
        };
    });

    test('render', () => {
        // Should render default page sizes.
        let tree = renderer.create(<PageSizeMenu {...props} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Should render 40 as page size, menu entry should be active.
        props.pageSize = 40;
        tree = renderer.create(<PageSizeMenu {...props} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Menu should be disabled
        props.disabled = true;
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('interactions', () => {
        const wrapper = mount<PageSizeMenu>(<PageSizeMenu {...props} />);
        wrapper.find('MenuItem').at(1).find('a').simulate('click');
        expect(props.setPageSize).toHaveBeenCalledWith(20);
        wrapper.find('MenuItem').last().find('a').simulate('click');
        expect(props.setPageSize).toHaveBeenCalledWith(400);
    });
});
