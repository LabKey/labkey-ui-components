/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { userEvent } from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { SAMPLE_STATE_TYPE_COLUMN_NAME } from '../samples/constants';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { createMockGetQueryDetails, createMockSelectRowsDeprecatedResponse } from '../../../test/MockUtils';

import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';

jest.mock('../../query/api', () => ({
    ...jest.requireActual('../../query/api'),
    getQueryDetails: () => createMockGetQueryDetails(),
    selectRowsDeprecated: () => createMockSelectRowsDeprecatedResponse(),
}));

describe('AddToPicklistMenuItem', () => {
    const schemaQuery = new SchemaQuery('test', 'query');

    test('not Editor', () => {
        renderWithAppContext(
            <AddToPicklistMenuItem schemaQuery={schemaQuery} selectedRowIds={['1', '2']} user={TEST_USER_READER} />
        );
        expect(document.querySelectorAll('.lk-menu-item')).toHaveLength(0);
    });

    async function validateMenuItemClick(shouldOpen: boolean): Promise<void> {
        const menuItem = document.querySelectorAll('.lk-menu-item a');
        expect(menuItem).toHaveLength(1);

        expect(document.querySelectorAll('.modal')).toHaveLength(0);
        await userEvent.click(menuItem[0]);
        await waitFor(() => {
            expect(document.querySelectorAll('.modal')).toHaveLength(shouldOpen ? 1 : 0);
        });
    }

    test('modal opens when there are selectedRowIds', async () => {
        renderWithAppContext(
            <AddToPicklistMenuItem schemaQuery={schemaQuery} selectedRowIds={[1]} user={TEST_USER_EDITOR} />
        );
        await validateMenuItemClick(true);
    });

    test('modal does not open when there are no selectedRowIds', async () => {
        renderWithAppContext(
            <AddToPicklistMenuItem schemaQuery={schemaQuery} selectedRowIds={[]} user={TEST_USER_EDITOR} />
        );
        await validateMenuItemClick(false);
    });

    test('modal does not open when selectedRowIds is undefined', async () => {
        renderWithAppContext(<AddToPicklistMenuItem schemaQuery={schemaQuery} user={TEST_USER_EDITOR} />);
        await validateMenuItemClick(false);
    });
});
