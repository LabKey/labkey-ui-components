import React from 'react';
import { render } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';

import { OntologyBrowserPanel, OntologyBrowserPanelImpl } from './OntologyBrowserPanel';
import { ConceptModel, OntologyModel } from './models';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchAlternatePaths: jest.fn().mockResolvedValue([]),
    fetchChildPaths: jest.fn().mockResolvedValue({ children: [] }),
    fetchConceptForCode: jest.fn().mockResolvedValue(undefined),
    fetchParentPaths: jest.fn().mockResolvedValue([]),
    getOntologyDetails: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../files/FileTree', () => ({
    DEFAULT_ROOT_PREFIX: '|root',
    FileTree: () => <div className="mock-file-tree" />,
}));

const TEST_ONTOLOGY = new OntologyModel({
    abbreviation: 't',
    name: 'test name',
    conceptCount: 100,
    description: 'test desc',
});
const TEST_CONCEPT = new ConceptModel({ code: 'a', label: 'b' });

describe('OntologyBrowserPanel', () => {
    test('no initOntologyId', async () => {
        const { container } = render(<OntologyBrowserPanel />);
        // Default asPanel=true, OntologySelectionPanel shown with asPanel=true
        await waitFor(() => {
            // After fetchChildPaths resolves with empty children, shows no-ontologies warning
            expect(container.querySelector('.alert-warning')).not.toBeNull();
        });
        expect(container.querySelector('.ontology-browser-container')).not.toBeNull();
    });

    test('with initOntologyId', () => {
        const { container } = render(<OntologyBrowserPanel initOntologyId="testOntId" />);
        // OntologyBrowserPanelImpl renders, getOntologyDetails resolves with undefined => spinner stays
        expect(container.querySelector('.fa-spinner')).not.toBeNull();
    });

    test('asPanel false', async () => {
        const { container } = render(<OntologyBrowserPanel asPanel={false} />);
        await waitFor(() => {
            expect(container.querySelector('.alert-warning')).not.toBeNull();
        });
        // OntologySelectionPanel rendered with asPanel=false => no panel container
        expect(container.querySelector('.ontology-browser-container')).toBeNull();
    });
});

const DEFAULT_IMPL_PROPS = {
    ontology: undefined,
    selectedConcept: undefined,
    setSelectedPath: jest.fn(),
    asPanel: false,
};

describe('OntologyBrowserPanelImpl', () => {
    test('loading', () => {
        const { container } = render(<OntologyBrowserPanelImpl {...DEFAULT_IMPL_PROPS} />);
        expect(container.querySelector('.fa-spinner')).not.toBeNull();
        expect(container.querySelector('.ontology-browser-container')).toBeNull();
    });

    test('ontology', () => {
        const { container } = render(<OntologyBrowserPanelImpl {...DEFAULT_IMPL_PROPS} ontology={TEST_ONTOLOGY} />);
        expect(container.querySelector('.ontology-browser-container')).not.toBeNull();
        expect(container.querySelector('.left-panel')).not.toBeNull();
        expect(container.querySelector('.right-panel')).not.toBeNull();
        expect(container.querySelector('.concept-search-container')).not.toBeNull();
        expect(container.querySelector('.mock-file-tree')).not.toBeNull();
        expect(container.querySelector('.panel-body')).toBeNull();
    });

    test('selectedConcept', () => {
        const { container } = render(
            <OntologyBrowserPanelImpl {...DEFAULT_IMPL_PROPS} ontology={TEST_ONTOLOGY} selectedConcept={TEST_CONCEPT} />
        );
        expect(container.querySelector('.ontology-browser-container')).not.toBeNull();
        expect(container.querySelector('.left-panel')).not.toBeNull();
        expect(container.querySelector('.right-panel')).not.toBeNull();
    });

    test('asPanel', () => {
        const { container } = render(
            <OntologyBrowserPanelImpl {...DEFAULT_IMPL_PROPS} asPanel={true} ontology={TEST_ONTOLOGY} />
        );
        expect(container.querySelector('.ontology-browser-container')).not.toBeNull();
        expect(container.querySelector('.panel-body')).not.toBeNull();
        expect(container.querySelector('.panel-heading').textContent).toContain('Browse test name (t)');
    });
});
