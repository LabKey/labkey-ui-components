/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { List } from 'immutable';

import { BaseDomainDesigner } from './BaseDomainDesigner';
import { DomainDesign } from './models';
import { SEVERITY_LEVEL_ERROR } from './constants';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { getTestAPIWrapper } from '../../APIWrapper';
import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';
import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';
import { COMMENT_FIELD_ID } from '../forms/input/CommentTextArea';

const BASE_PROPS = {
    hasValidProperties: true,
    exception: undefined,
    domains: List.of(DomainDesign.create({})),
    name: 'Test',
    submitting: false,
    visitedPanels: List.of(0),
    onCancel: jest.fn(),
    onFinish: jest.fn(),
};

describe('BaseDomainDesigner', () => {
    async function buttonValidation(saveBtnText: string, saveDisabled: boolean): Promise<void> {
        expect(document.querySelectorAll('.cancel-button')).toHaveLength(1);
        expect(document.querySelector('.save-button')).toHaveTextContent(saveBtnText);

        await waitFor(() => {
            expect(document.querySelector('.save-button').hasAttribute('disabled')).toBe(saveDisabled);
        });
    }

    test('without error', async () => {
        renderWithAppContext(<BaseDomainDesigner {...BASE_PROPS} />);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        await buttonValidation('Save', false);
    });

    test('hasValidProperties', async () => {
        renderWithAppContext(<BaseDomainDesigner {...BASE_PROPS} hasValidProperties={false} />);
        expect(document.querySelectorAll('.alert')).toHaveLength(1);
        expect(document.querySelector('.alert')).toHaveTextContent(
            'Please correct errors in the properties panel before saving.'
        );
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        await buttonValidation('Save', false);
    });

    test('exception', async () => {
        renderWithAppContext(<BaseDomainDesigner {...BASE_PROPS} exception="Test exception text" />);
        expect(document.querySelectorAll('.alert')).toHaveLength(1);
        expect(document.querySelector('.alert')).toHaveTextContent('Test exception text');
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        await buttonValidation('Save', false);
    });

    test('errorDomains', async () => {
        renderWithAppContext(
            <BaseDomainDesigner
                {...BASE_PROPS}
                domains={List.of(
                    DomainDesign.create(
                        { name: BASE_PROPS.name },
                        { exception: 'test1', severity: SEVERITY_LEVEL_ERROR }
                    )
                )}
            />
        );
        expect(document.querySelectorAll('.alert')).toHaveLength(1);
        expect(document.querySelector('.alert')).toHaveTextContent('Please correct errors in Test before saving.');
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        await buttonValidation('Save', false);
    });

    test('submitting, saveBtnText', async () => {
        renderWithAppContext(<BaseDomainDesigner {...BASE_PROPS} saveBtnText="Finish" submitting />);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        await buttonValidation('Finish', true);
    });

    describe('comments required', () => {
        const REQUIRE_COMMENTS_CONTEXT = {
            appContext: {
                api: getTestAPIWrapper(jest.fn, {
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: true }),
                    }),
                }),
            },
            serverContext: { container: TEST_PROJECT_CONTAINER },
        };

        test('showUserComment omitted', async () => {
            renderWithAppContext(<BaseDomainDesigner {...BASE_PROPS} />, REQUIRE_COMMENTS_CONTEXT);
            await buttonValidation('Save', false);
            expect(document.getElementById(COMMENT_FIELD_ID)).not.toBeInTheDocument();
        });

        test('showUserComment', async () => {
            renderWithAppContext(<BaseDomainDesigner {...BASE_PROPS} showUserComment />, REQUIRE_COMMENTS_CONTEXT);
            await waitFor(() => {
                expect(document.getElementById(COMMENT_FIELD_ID)).toHaveAttribute(
                    'placeholder',
                    'Enter reason (required)'
                );
            });
            expect(document.querySelector('.save-button')).toBeDisabled();

            await userEvent.type(document.getElementById(COMMENT_FIELD_ID), 'Adding a field');
            expect(document.querySelector('.save-button')).toBeEnabled();
        });
    });
});
