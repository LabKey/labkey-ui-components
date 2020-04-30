import React from 'react';
import renderer from 'react-test-renderer';

import { DeleteIcon } from './DeleteIcon';

describe('<DeleteIcon/>', () => {
    test('default properties', () => {
        const component = <DeleteIcon onDelete={jest.fn()} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom properties', () => {
        const component = (
            <DeleteIcon
                onDelete={jest.fn()}
                id="delete-icon-custom-id"
                iconCls="delete-icon-custom-cls"
                title="Delete Icon Custom Title"
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
