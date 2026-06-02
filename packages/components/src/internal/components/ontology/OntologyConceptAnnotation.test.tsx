/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';

import { DOMAIN_FIELD_FULLY_LOCKED } from '../domainproperties/constants';
import { DomainField } from '../domainproperties/models';

import { OntologyConceptAnnotation } from './OntologyConceptAnnotation';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchAlternatePaths: jest.fn().mockResolvedValue([]),
    fetchConceptForCode: jest.fn().mockResolvedValue(undefined),
    fetchPathModel: jest.fn().mockResolvedValue(undefined),
    getOntologyDetails: jest.fn().mockResolvedValue(undefined),
}));

const DEFAULT_PROPS = {
    id: 'testId',
    field: new DomainField(),
    onChange: jest.fn(),
};

const TEST_FIELD = new DomainField({ principalConceptCode: 'code:123' });

describe('OntologyConceptAnnotation', () => {
    test('no principalConceptCode', () => {
        const { container } = render(<OntologyConceptAnnotation {...DEFAULT_PROPS} />);
        expect(container.querySelector('.domain-annotation-table')).not.toBeNull();
        expect(container.querySelector('.domain-validation-button').textContent).toBe('Select Concept');
        expect(container.querySelector('.domain-text-label').textContent).toBe('None Set');
        expect(container.querySelector('.domain-annotation-item')).toBeNull();
    });

    test('principalConceptCode', async () => {
        const { container } = render(<OntologyConceptAnnotation {...DEFAULT_PROPS} field={TEST_FIELD} />);
        await waitFor(() => {
            expect(container.querySelector('.domain-annotation-item').textContent).toBe(
                TEST_FIELD.principalConceptCode
            );
        });
        expect(container.querySelector('.domain-text-label')).toBeNull();
        expect(container.querySelector('.fa-remove')).not.toBeNull();
        expect((container.querySelector('.domain-validation-button') as HTMLButtonElement).disabled).toBe(false);
    });

    test('isFieldLocked', async () => {
        const field = TEST_FIELD.merge({ lockType: DOMAIN_FIELD_FULLY_LOCKED }) as DomainField;
        const { container } = render(<OntologyConceptAnnotation {...DEFAULT_PROPS} field={field} />);
        await waitFor(() => {
            expect(container.querySelector('.domain-annotation-item.domain-text-label')).not.toBeNull();
        });
        const button = container.querySelector('.domain-validation-button') as HTMLButtonElement;
        expect(button.disabled).toBe(true);
        expect(button.id).toBe(DEFAULT_PROPS.id);
        expect(button.name).toBe('domainpropertiesrow-principalConceptCode');
        expect(container.querySelector('.fa-remove')).toBeNull();
    });

    test('showSelectModal', async () => {
        const { container } = render(<OntologyConceptAnnotation {...DEFAULT_PROPS} field={TEST_FIELD} />);
        expect(document.querySelector('.modal-title')).toBeNull();
        fireEvent.click(container.querySelector('.domain-validation-button'));
        await waitFor(() => {
            expect(document.querySelector('.modal-title').textContent).toBe('Select Concept');
        });
    });
});
