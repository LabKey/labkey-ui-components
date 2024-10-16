import React from 'react';
import { PermissionTypes } from '@labkey/api';

import { PicklistButton } from '../picklist/PicklistButton';
import { TEST_USER_FOLDER_ADMIN, TEST_USER_READER } from '../../userFixtures';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

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
        renderWithAppContext(<ResponsiveMenuButtonGroup {...DEFAULT_PROPS} user={TEST_USER_FOLDER_ADMIN} />, {
            serverContext: { user: TEST_USER_FOLDER_ADMIN },
        });
        expect(document.querySelectorAll('button')).toHaveLength(2);
    });

    test('reader', () => {
        renderWithAppContext(<ResponsiveMenuButtonGroup {...DEFAULT_PROPS} user={TEST_USER_READER} />, {
            serverContext: { user: TEST_USER_READER },
        });
        expect(document.querySelectorAll('button')).toHaveLength(0);
    });
});
