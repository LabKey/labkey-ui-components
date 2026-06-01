/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';

import { DOMAIN_FIELD_FULLY_LOCKED } from '../domainproperties/constants';
import { DomainField } from '../domainproperties/models';

import { OntologyConceptSelectButton } from './OntologyConceptSelectButton';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchAlternatePaths: jest.fn().mockResolvedValue([]),
    fetchChildPaths: jest.fn().mockResolvedValue(undefined),
    fetchConceptForCode: jest.fn().mockResolvedValue(undefined),
    fetchPathModel: jest.fn().mockResolvedValue(undefined),
    getOntologyDetails: jest.fn().mockResolvedValue(undefined),
}));

const DEFAULT_PROPS = {
    id: 'test-id',
    title: 'Button Title',
    field: new DomainField({}),
    valueProp: 'principalConceptCode',
    valueIsPath: false,
    onChange: jest.fn(),
};

describe('OntologyConceptSelectButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('no value set', () => {
        const { container } = render(<OntologyConceptSelectButton {...DEFAULT_PROPS} />);
        expect(container.querySelector('.domain-annotation-table')).not.toBeNull();
        const button = container.querySelector('button') as HTMLButtonElement;
        expect(button.textContent).toBe('Button Title');
        expect(button.disabled).toBe(false);
        expect(container.querySelector('.fa-remove')).toBeNull();
        expect(container.querySelector('.domain-text-label').textContent).toBe('None Set');
        expect(container.querySelector('.domain-annotation-item')).toBeNull();
    });

    test('showSelectModal', async () => {
        const { container } = render(<OntologyConceptSelectButton {...DEFAULT_PROPS} />);
        expect(document.querySelector('.modal-title')).toBeNull();
        fireEvent.click(container.querySelector('button'));
        await waitFor(() => {
            expect(document.querySelector('.modal-title').textContent).toBe('Button Title');
        });
    });

    test('with value set', async () => {
        const { container } = render(
            <OntologyConceptSelectButton
                {...DEFAULT_PROPS}
                field={new DomainField({ principalConceptCode: 'TEST VALUE' })}
            />
        );
        await waitFor(() => {
            expect(container.querySelector('.domain-annotation-item').textContent).toBe('TEST VALUE');
        });
        expect(container.querySelector('.domain-text-label')).toBeNull();
        expect(container.querySelector('.fa-remove')).not.toBeNull();
    });

    test('isFieldLocked', async () => {
        const { container } = render(
            <OntologyConceptSelectButton
                {...DEFAULT_PROPS}
                field={new DomainField({ principalConceptCode: 'TEST VALUE', lockType: DOMAIN_FIELD_FULLY_LOCKED })}
            />
        );
        await waitFor(() => {
            expect(container.querySelector('.domain-annotation-item.domain-text-label')).not.toBeNull();
        });
        expect((container.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
        expect(container.querySelector('.domain-annotation-item').textContent).toBe('TEST VALUE');
        expect(container.querySelector('.fa-remove')).toBeNull();
    });

    test('OntologyBrowserModal props', async () => {
        const { container } = render(
            <OntologyConceptSelectButton
                {...DEFAULT_PROPS}
                field={new DomainField({ sourceOntology: 'Test Source' })}
            />
        );
        fireEvent.click(container.querySelector('button'));
        await waitFor(() => {
            expect(document.querySelector('.modal-title')).not.toBeNull();
        });
        const { getOntologyDetails } = jest.requireMock('./actions');
        expect(getOntologyDetails).not.toHaveBeenCalled();
    });

    test('useFieldSourceOntology', async () => {
        const { container } = render(
            <OntologyConceptSelectButton
                {...DEFAULT_PROPS}
                field={new DomainField({ sourceOntology: 'Test Source' })}
                useFieldSourceOntology
            />
        );
        fireEvent.click(container.querySelector('button'));
        const { getOntologyDetails } = jest.requireMock('./actions');
        await waitFor(() => {
            expect(getOntologyDetails).toHaveBeenCalledWith('Test Source');
        });
    });
});
