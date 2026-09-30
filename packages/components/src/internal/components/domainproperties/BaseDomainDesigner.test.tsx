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

    test('without error', () => {
        renderWithAppContext(<BaseDomainDesigner {...BASE_PROPS} />);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        buttonValidation('Save', false);
    });

    test('hasValidProperties', () => {
        renderWithAppContext(<BaseDomainDesigner {...BASE_PROPS} hasValidProperties={false} />);
        expect(document.querySelectorAll('.alert')).toHaveLength(1);
        expect(document.querySelector('.alert')).toHaveTextContent(
            'Please correct errors in the properties panel before saving.'
        );
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        buttonValidation('Save', false);
    });

    test('exception', () => {
        renderWithAppContext(<BaseDomainDesigner {...BASE_PROPS} exception="Test exception text" />);
        expect(document.querySelectorAll('.alert')).toHaveLength(1);
        expect(document.querySelector('.alert')).toHaveTextContent('Test exception text');
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        buttonValidation('Save', false);
    });

    test('errorDomains', () => {
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
        buttonValidation('Save', false);
    });

    test('submitting, saveBtnText', () => {
        renderWithAppContext(<BaseDomainDesigner {...BASE_PROPS} saveBtnText="Finish" submitting />);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        buttonValidation('Finish', true);
    });
});
