import React from 'react';
import renderer from 'react-test-renderer';
import { fromJS } from 'immutable';

import { Button } from 'react-bootstrap';

import { TEST_USER_ASSAY_DESIGNER, TEST_USER_READER } from '../../../test/data/users';

import { UserDetailHeader } from './UserDetailHeader';

describe('<UserDetailHeader/>', () => {
    test('default properties', () => {
        const component = (
            <UserDetailHeader
                title="Title"
                user={TEST_USER_READER}
                userProperties={fromJS({})}
                dateFormat={undefined}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom properties', () => {
        const component = (
            <UserDetailHeader
                title="Title (Custom)"
                user={TEST_USER_ASSAY_DESIGNER}
                userProperties={fromJS({ lastLogin: '2019-11-15 13:50:17.987' })}
                dateFormat="YYYY-MM-DD"
                renderButtons={() => <Button>Test</Button>}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom description', () => {
        const component = (
            <UserDetailHeader
                title="Title"
                user={TEST_USER_ASSAY_DESIGNER}
                userProperties={fromJS({})}
                dateFormat={undefined}
                description="My custom description"
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
