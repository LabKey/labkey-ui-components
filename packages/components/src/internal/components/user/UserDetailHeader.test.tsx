import React from 'react';
import { render } from '@testing-library/react';

import { Button } from 'react-bootstrap';

import { TEST_USER_ASSAY_DESIGNER, TEST_USER_READER } from '../../userFixtures';

import { UserDetailHeader } from './UserDetailHeader';

describe('<UserDetailHeader/>', () => {
    test('default properties', () => {
        const component = <UserDetailHeader title="Title" user={TEST_USER_READER} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
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
                userProperties={{ lastLogin: '2019-11-15 13:50:17.987' }}
            />
        );
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
