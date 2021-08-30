import React from 'react';
import renderer from 'react-test-renderer';
import { fromJS } from 'immutable';

import { Button } from 'react-bootstrap';

import { TEST_USER_ASSAY_DESIGNER, TEST_USER_READER } from '../../../test/data/users';

import { UserDetailHeader } from './UserDetailHeader';

describe('<UserDetailHeader/>', () => {
    test('default properties', () => {
        const component = <UserDetailHeader dateFormat="YYYY-MM-DD" title="Title" user={TEST_USER_READER} />;
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
    });

    test('optional properties', () => {
        const component = (
            <UserDetailHeader
                container={{ title: 'Container Title' }}
                dateFormat="YYYY-MM-DD"
                description="My custom description"
                renderButtons={<Button>Test</Button>}
                title="Title (Custom)"
                user={TEST_USER_ASSAY_DESIGNER}
                userProperties={fromJS({ lastLogin: '2019-11-15 13:50:17.987' })}
            />
        );
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
    });
});
