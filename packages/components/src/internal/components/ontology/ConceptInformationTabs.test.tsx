/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { ConceptInformationTabs } from './ConceptInformationTabs';
import { ConceptModel } from './models';
import { waitFor } from '@testing-library/dom';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchAlternatePaths: jest.fn().mockResolvedValue([]),
}));

const DEFAULT_PROPS = {
    concept: undefined,
    alternatePathClickHandler: jest.fn(),
};

describe('ConceptInformationTabs', () => {
    test('no concept', () => {
        const { container } = render(<ConceptInformationTabs {...DEFAULT_PROPS} />);
        expect(container.querySelectorAll('li[role="presentation"]')).toHaveLength(2);
        expect(container.querySelectorAll('.ontology-concept-overview-container')).toHaveLength(1);
        expect(container.querySelectorAll('.ontology-concept-pathinfo-container')).toHaveLength(1);
        expect(container.querySelectorAll('.none-selected')).toHaveLength(2);
    });

    test('with concept', async () => {
        const concept = new ConceptModel({ code: 'a', label: 'b' });
        const { container } = render(<ConceptInformationTabs {...DEFAULT_PROPS} concept={concept} />);
        await waitFor(() => {
            expect(container.querySelectorAll('li[role="presentation"]')).toHaveLength(2);
        });
        expect(container.querySelectorAll('.ontology-concept-overview-container')).toHaveLength(1);
        expect(container.querySelectorAll('.ontology-concept-pathinfo-container')).toHaveLength(1);
        expect(container.querySelector('.title').textContent).toBe('b');
        expect(container.querySelector('.code').textContent).toBe('a');
    });
});
