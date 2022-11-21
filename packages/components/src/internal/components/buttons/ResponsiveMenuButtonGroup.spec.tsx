import React from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { ReactWrapper } from 'enzyme';
import { PermissionTypes } from '@labkey/api';

import { PicklistButton } from '../picklist/PicklistButton';
import { TEST_USER_FOLDER_ADMIN, TEST_USER_READER } from '../../userFixtures';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { mountWithServerContext } from '../../testHelpers';

import { ResponsiveMenuButtonGroup } from './ResponsiveMenuButtonGroup';

describe('ResponsiveMenuButtonGroup', () => {
    const model = makeTestQueryModel(SchemaQuery.create('s', 'q'));
    const DEFAULT_PROPS = {
        items: [
            { button: <PicklistButton model={model} user={TEST_USER_READER} />, perm: PermissionTypes.ManagePicklists },
            { button: <PicklistButton model={model}  user={TEST_USER_READER} />, perm: PermissionTypes.ManagePicklists },
        ],
    };

    function validate(wrapper: ReactWrapper, rendered = true): void {
        expect(wrapper.find(DropdownButton)).toHaveLength(rendered ? 1 : 0);
        expect(wrapper.find(MenuItem)).toHaveLength(rendered ? 3 : 0); // with divider
        if (rendered) expect(wrapper.find(PicklistButton).first().prop('asSubMenu')).toBe(true);
    }

    test('admin', () => {
        const wrapper = mountWithServerContext(
            <ResponsiveMenuButtonGroup {...DEFAULT_PROPS} user={TEST_USER_FOLDER_ADMIN} />,
            { user: TEST_USER_FOLDER_ADMIN }
        );
        validate(wrapper);
        wrapper.unmount();
    });

    test('reader', () => {
        const wrapper = mountWithServerContext(
            <ResponsiveMenuButtonGroup {...DEFAULT_PROPS} user={TEST_USER_READER} />,
            { user: TEST_USER_READER }
        );
        validate(wrapper, false);
        wrapper.unmount();
    });
});
