import React from 'react';
import { render } from '@testing-library/react';

import { OntologyBrowserFilterPanel } from './OntologyBrowserFilterPanel';
import { PathModel } from './models';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchAlternatePaths: jest.fn().mockResolvedValue([]),
    fetchChildPaths: jest.fn().mockResolvedValue({ children: [] }),
    fetchConceptForCode: jest.fn().mockResolvedValue(undefined),
    fetchParentPaths: jest.fn().mockResolvedValue([]),
    fetchPathModel: jest.fn().mockResolvedValue({
        path: 'root',
        code: 'testroot',
        label: 'test root',
        hasChildren: false,
        children: undefined,
    } as PathModel),
    getOntologyDetails: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../files/FileTree', () => ({
    DEFAULT_ROOT_PREFIX: '|root',
    FileTree: () => <div className="mock-file-tree" />,
}));

const DEFAULT_PROPS = {
    ontologyId: 'TestOntology',
    conceptSubtree: undefined,
    filterValue: undefined,
    filterType: undefined,
    onFilterChange: jest.fn(),
};

describe('OntologyBrowserFilterPanel', () => {
    test('default props', () => {
        const { container } = render(<OntologyBrowserFilterPanel {...DEFAULT_PROPS} />);
        expect(container.querySelector('[role="alert"]')).toBeNull();
        expect(container.querySelector('.fa-spinner')).not.toBeNull();
    });
});
