import React from 'react';
import { DropdownButton } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { PicklistButton } from '../picklist/PicklistButton';
import { TEST_USER_FOLDER_ADMIN, TEST_USER_READER } from '../../userFixtures';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { mountWithServerContext } from '../../test/enzymeTestHelpers';

import { ResponsiveMenuButtonGroup } from './ResponsiveMenuButtonGroup';

describe('ResponsiveMenuButtonGroup', () => {
    const model = makeTestQueryModel(new SchemaQuery('s', 'q'));
    const DEFAULT_PROPS = {
        items: [
            { button: <PicklistButton model={model} user={TEST_USER_READER} />, perm: PermissionTypes.ManagePicklists },
            { button: <PicklistButton model={model} user={TEST_USER_READER} />, perm: PermissionTypes.ManagePicklists },
        ],
    };

    test('admin', () => {
        const wrapper = mountWithServerContext(
            <ResponsiveMenuButtonGroup {...DEFAULT_PROPS} user={TEST_USER_FOLDER_ADMIN} />,
            { user: TEST_USER_FOLDER_ADMIN }
        );
        expect(wrapper.find(DropdownButton)).toHaveLength(2);
        wrapper.unmount();
    });

    test('reader', () => {
        const wrapper = mountWithServerContext(
            <ResponsiveMenuButtonGroup {...DEFAULT_PROPS} user={TEST_USER_READER} />,
            { user: TEST_USER_READER }
        );
        expect(wrapper.find(DropdownButton)).toHaveLength(0);
        wrapper.unmount();
    });
});
