import React from 'react';
import { render } from '@testing-library/react';

import { PathModel } from './models';
import { OntologySelectionPanelImpl } from './OntologySelectionPanel';

const DEFAULT_PROPS = {
    error: undefined,
    ontologies: undefined,
    asPanel: false,
    onOntologySelection: jest.fn(),
};

describe('OntologySelectionPanel', () => {
    afterEach(() => {
        LABKEY.user.isRootAdmin = false;
    });

    test('loading', () => {
        const { container } = render(<OntologySelectionPanelImpl {...DEFAULT_PROPS} />);
        expect(container.querySelector('.fa-spinner')).not.toBeNull();
        expect(container.querySelector('.alert-warning')).toBeNull();
        expect(container.querySelector('[role="alert"]')).toBeNull();
        expect(container.querySelector('.ontology-browser-container')).toBeNull();
    });

    test('no ontologies, non root admin', () => {
        const { container } = render(<OntologySelectionPanelImpl {...DEFAULT_PROPS} ontologies={[]} />);
        expect(container.querySelector('.fa-spinner')).toBeNull();
        expect(container.querySelector('.alert-warning')).not.toBeNull();
        expect(container.querySelector('.alert-warning').textContent).toBe(
            'No ontologies have been loaded for this server.'
        );
    });

    test('no ontologies, as root admin', () => {
        LABKEY.user.isRootAdmin = true;
        const { container } = render(<OntologySelectionPanelImpl {...DEFAULT_PROPS} ontologies={[]} />);
        expect(container.querySelector('.alert-warning')).not.toBeNull();
        expect(container.querySelector('.alert-warning').textContent).toContain('Click here to get started.');
    });

    test('with ontologies', () => {
        const { container } = render(
            <OntologySelectionPanelImpl {...DEFAULT_PROPS} ontologies={[new PathModel()]} />
        );
        expect(container.querySelector('.fa-spinner')).toBeNull();
        expect(container.querySelector('.alert-warning')).toBeNull();
    });

    test('asPanel', () => {
        const { container } = render(
            <OntologySelectionPanelImpl {...DEFAULT_PROPS} ontologies={[]} asPanel={true} />
        );
        expect(container.querySelector('.ontology-browser-container')).not.toBeNull();
        expect(container.querySelector('.panel-body')).not.toBeNull();
    });

    test('error', () => {
        const { container } = render(
            <OntologySelectionPanelImpl {...DEFAULT_PROPS} ontologies={[]} error="test error" />
        );
        expect(container.querySelector('[role="alert"]')).not.toBeNull();
        expect(container.querySelector('[role="alert"]').textContent).toBe('test error');
    });
});
