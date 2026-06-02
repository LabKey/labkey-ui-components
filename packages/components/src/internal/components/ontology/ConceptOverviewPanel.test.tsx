/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import {
    ConceptOverviewPanelImpl,
    ConceptOverviewTooltip,
    ConceptSynonyms,
    OntologyConceptOverviewPanel,
} from './ConceptOverviewPanel';
import { ConceptModel, PathModel } from './models';
import { waitFor } from '@testing-library/dom';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchConceptForCode: jest.fn().mockResolvedValue(undefined),
    fetchParentPaths: jest.fn().mockResolvedValue([]),
}));

const TEST_CONCEPT = new ConceptModel({ code: 'a', label: 'b', description: 'c' });
const TEST_PATH = new PathModel({});

describe('OntologyConceptOverviewPanel', () => {
    test('without code prop', () => {
        const { container } = render(<OntologyConceptOverviewPanel code={undefined} />);
        expect(container.querySelector('[role="alert"]')).toBeNull();
        expect(container.querySelector('.none-selected')).toBeNull();
        expect(container.querySelector('.title')).toBeNull();
    });
});

describe('ConceptSynonyms', () => {
    test('without synonyms', () => {
        const { container, rerender } = render(<ConceptSynonyms synonyms={undefined} />);
        expect(container.querySelector('.synonyms-title')).toBeNull();
        expect(container.querySelector('.synonyms-text')).toBeNull();

        rerender(<ConceptSynonyms synonyms={[]} />);
        expect(container.querySelector('.synonyms-title')).toBeNull();
        expect(container.querySelector('.synonyms-text')).toBeNull();
    });

    test('with sorted synonyms', () => {
        const { container } = render(<ConceptSynonyms synonyms={['a', 'c', 'b']} />);
        expect(container.querySelector('.synonyms-title')).not.toBeNull();
        expect(container.querySelector('.synonyms-text')).not.toBeNull();
        const items = container.querySelectorAll('li');
        expect(items).toHaveLength(3);
        expect(items[0].textContent).toBe('a');
        expect(items[1].textContent).toBe('b');
        expect(items[2].textContent).toBe('c');
    });
});

describe('ConceptOverviewPanelImpl', () => {
    test('no concept', () => {
        const { container } = render(<ConceptOverviewPanelImpl concept={undefined} />);
        expect(container.querySelector('.none-selected').textContent).toBe('No concept selected');
        expect(container.querySelector('.title')).toBeNull();
        expect(container.querySelector('.code')).toBeNull();
    });

    test('with concept', () => {
        const { container } = render(<ConceptOverviewPanelImpl concept={TEST_CONCEPT} />);
        expect(container.querySelector('.none-selected')).toBeNull();
        expect(container.querySelector('button')).toBeNull();
        expect(container.querySelector('.title').textContent).toBe('b');
        expect(container.querySelector('.code').textContent).toBe('a');
        expect(container.querySelector('.description-title').textContent).toBe('Description');
        expect(container.querySelector('.description-text').textContent).toBe('c');
    });

    test('with selected path, not shown', () => {
        const { container } = render(<ConceptOverviewPanelImpl concept={TEST_CONCEPT} selectedPath={TEST_PATH} />);
        const button = container.querySelector('button');
        expect(button.textContent).toBe('Show Path');
        expect(container.querySelector('.concept-overview-selected-path')).toBeNull();
    });

    test('with selected path, shown', async () => {
        const { container } = render(<ConceptOverviewPanelImpl concept={TEST_CONCEPT} selectedPath={TEST_PATH} />);
        fireEvent.click(container.querySelector('button'));
        await waitFor(() => {
            expect(container.querySelector('button').textContent).toBe('Hide Path');
        });
        expect(container.querySelector('.concept-overview-selected-path')).not.toBeNull();
        expect(container.querySelector('.concept-path-container.selected')).not.toBeNull();
    });
});

describe('ConceptOverviewTooltip', () => {
    test('no concept', () => {
        const { container } = render(<ConceptOverviewTooltip concept={undefined} />);
        expect(container.querySelector('[role="alert"]')).toBeNull();
        expect(container.querySelector('.fa-info-circle')).toBeNull();
        expect(container.querySelector('.overlay-trigger')).not.toBeNull();
    });

    test('with concept', async () => {
        const { container } = render(<ConceptOverviewTooltip concept={TEST_CONCEPT} />);
        expect(container.querySelector('[role="alert"]')).toBeNull();
        expect(container.querySelector('.fa-info-circle')).not.toBeNull();
        fireEvent.mouseEnter(container.querySelector('.overlay-trigger'));
        await waitFor(() => {
            expect(document.querySelector('.ontology-concept-overview-container')).not.toBeNull();
        });
    });

    test('with path', () => {
        const { container } = render(<ConceptOverviewTooltip concept={TEST_CONCEPT} path={TEST_PATH} />);
        expect(container.querySelector('[role="alert"]')).toBeNull();
        expect(container.querySelector('.fa-info-circle')).not.toBeNull();
    });

    test('error', () => {
        const { container } = render(<ConceptOverviewTooltip concept={TEST_CONCEPT} error="test error" />);
        expect(container.querySelector('[role="alert"]').textContent).toBe('test error');
        expect(container.querySelector('.overlay-trigger')).toBeNull();
    });
});
