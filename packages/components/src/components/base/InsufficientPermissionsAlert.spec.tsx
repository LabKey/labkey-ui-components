import React from 'react';
import renderer from 'react-test-renderer';

import { InsufficientPermissionsAlert } from './InsufficientPermissionsAlert';

describe('<InsufficientPermissionsAlert/>', () => {
    test('default properties', () => {
        const component = <InsufficientPermissionsAlert />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
