import React from 'react';
import { render } from '@testing-library/react';

import { ConceptPathDisplay, ConceptPathDisplayImpl } from './ConceptPathDisplay';
import { PathModel } from './models';
import { waitFor } from '@testing-library/dom';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchParentPaths: jest.fn().mockResolvedValue([]),
}));

const TEST_CONCEPT_PATH = new PathModel();

describe('ConceptPathDisplay', () => {
    test('Path not set', () => {
        const { container } = render(<ConceptPathDisplay path={undefined} />);
        expect(container.querySelector('[role="alert"]')).toBeNull();
        expect(container.querySelector('.concept-path-container')).toBeNull();
    });

    test('Path set', async () => {
        const { container } = render(
            <ConceptPathDisplay isSelected={true} path={TEST_CONCEPT_PATH} title="test title" />
        );
        await waitFor(() => {
            expect(container.querySelector('.concept-path-container.selected')).not.toBeNull();
        });
        expect(container.querySelector('.title').textContent).toBe('test title');
        expect(container.querySelector('.fa-spinner')).toBeNull();
    });
});

describe('ConceptPathDisplayImpl', () => {
    test('No path loaded', () => {
        const { container } = render(<ConceptPathDisplayImpl parentPaths={undefined} path={undefined} />);
        expect(container.querySelector('.concept-path-container')).toBeNull();
        expect(container.querySelector('.concept-path')).toBeNull();
    });

    test('Parent path not loaded yet', () => {
        const { container } = render(<ConceptPathDisplayImpl parentPaths={undefined} path={TEST_CONCEPT_PATH} />);
        expect(container.querySelector('.concept-path-container')).not.toBeNull();
        expect(container.querySelector('.concept-path')).not.toBeNull();
        expect(container.querySelector('.selected')).toBeNull();
        expect(container.querySelector('.fa-spinner')).not.toBeNull();
        expect(container.querySelectorAll('.concept-path-label')).toHaveLength(0);
    });

    test('Parent path empty', () => {
        const { container } = render(<ConceptPathDisplayImpl parentPaths={[]} path={TEST_CONCEPT_PATH} />);
        expect(container.querySelector('.concept-path-container')).not.toBeNull();
        expect(container.querySelector('.fa-spinner')).toBeNull();
        expect(container.querySelectorAll('.concept-path-label')).toHaveLength(0);
        expect(container.querySelectorAll('.concept-path-spacer')).toHaveLength(0);
    });

    test('Parent path set with one path', () => {
        const parentPaths = [new PathModel({ label: 'first' })];
        const { container } = render(<ConceptPathDisplayImpl parentPaths={parentPaths} path={TEST_CONCEPT_PATH} />);
        const labels = container.querySelectorAll('.concept-path-label');
        expect(labels).toHaveLength(1);
        expect(labels[0].textContent).toBe('first');
        expect(container.querySelectorAll('.concept-path-spacer')).toHaveLength(0);
    });

    test('Parent path set with multiple paths', () => {
        const parentPaths = [
            new PathModel({ label: 'first' }),
            new PathModel({ label: 'second' }),
            new PathModel({ label: 'third' }),
        ];
        const { container } = render(<ConceptPathDisplayImpl parentPaths={parentPaths} path={TEST_CONCEPT_PATH} />);
        const labels = container.querySelectorAll('.concept-path-label');
        expect(labels).toHaveLength(3);
        expect(labels[0].textContent).toBe('first');
        expect(labels[1].textContent).toBe('second');
        expect(labels[2].textContent).toBe('third');
        expect(container.querySelectorAll('.concept-path-spacer')).toHaveLength(2);
    });

    test('Title set', () => {
        const title = 'Long title to show';
        const { container } = render(
            <ConceptPathDisplayImpl parentPaths={[]} path={TEST_CONCEPT_PATH} title={title} />
        );
        expect(container.querySelector('.title').textContent).toBe(title);
    });

    test('Selected set', () => {
        const title = 'Long title to show';
        const { container } = render(
            <ConceptPathDisplayImpl isSelected={true} parentPaths={[]} path={TEST_CONCEPT_PATH} title={title} />
        );
        expect(container.querySelector('.concept-path-container.selected')).not.toBeNull();
        expect(container.querySelector('.title').textContent).toBe(title);
    });
});
