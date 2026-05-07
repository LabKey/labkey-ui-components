import React from 'react';
import { render } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';

import { OntologyBrowserModal } from './OntologyBrowserModal';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchAlternatePaths: jest.fn().mockResolvedValue([]),
    fetchChildPaths: jest.fn().mockResolvedValue({ children: [] }),
    fetchConceptForCode: jest.fn().mockResolvedValue(undefined),
    getOntologyDetails: jest.fn().mockResolvedValue(undefined),
}));

const DEFAULT_PROPS = {
    title: 'Test title',
    onCancel: jest.fn(),
    onApply: jest.fn(),
};

describe('OntologyBrowserModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('default props', () => {
        render(<OntologyBrowserModal {...DEFAULT_PROPS} />);
        expect(document.querySelector('.modal-title').textContent).toBe('Test title');
        expect(document.querySelectorAll('button')).toHaveLength(3);
    });

    test('OntologyBrowserPanel props', async () => {
        render(<OntologyBrowserModal {...DEFAULT_PROPS} initOntologyId="testOntId" />);
        const { getOntologyDetails } = jest.requireMock('./actions');
        await waitFor(() => {
            expect(getOntologyDetails).toHaveBeenCalledWith('testOntId');
        });
    });
});
