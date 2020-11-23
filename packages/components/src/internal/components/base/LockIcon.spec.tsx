import React from 'react';
import renderer from 'react-test-renderer';

import { LockIcon } from './LockIcon';

const DEFAULT_PROPS = {
    id: 'jest-lock-id',
    title: 'Jest Testing Lock',
    body: () => <div>Jest testing body</div>,
};

describe('<DeleteIcon/>', () => {
    test('default properties', () => {
        const component = <LockIcon {...DEFAULT_PROPS} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom properties', () => {
        const component = <LockIcon {...DEFAULT_PROPS} iconCls={'jest-testing-cls'} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
