import * as React from 'react'
import renderer from 'react-test-renderer'

import { Alert } from './Alert'

describe('<Alert />', () => {
    test('Renders with children', () => {
        const tree = renderer.create(<Alert>My alert message</Alert>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("Nothing displayed without children", () => {
        const message = undefined;
        const tree = renderer.create(<Alert>{message}</Alert>).toJSON();
        expect(tree).toMatchSnapshot();
    })
});

