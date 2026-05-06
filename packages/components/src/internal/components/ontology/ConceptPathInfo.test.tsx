import React from 'react';
import { render } from '@testing-library/react';

import { AlternatePathPanel, ConceptPathInfo, ConceptPathInfoImpl } from './ConceptPathInfo';
import { PathModel } from './models';
import { waitFor } from '@testing-library/dom';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchAlternatePaths: jest.fn().mockResolvedValue([]),
    fetchParentPaths: jest.fn().mockResolvedValue([]),
}));

const TEST_SELECTED_PATH = new PathModel({ code: 'a', label: 'A', path: 'a/a' });
const TEST_ALTERNATE_PATH = new PathModel({ code: 'a', label: 'A', path: 'b/a' });

describe('ConceptPathInfo', () => {
    test('Nothing set', () => {
        const { container } = render(<ConceptPathInfo alternatePathClickHandler={jest.fn()} />);
        expect(container.querySelector('[role="alert"]')).toBeNull();
        expect(container.querySelector('.none-selected').textContent).toBe('No concept selected');
    });
});

describe('ConceptPathInfoImpl', () => {
    test('Nothing set', () => {
        const { container } = render(
            <ConceptPathInfoImpl alternatePathClickHandler={jest.fn()} selectedCode={undefined} />
        );
        expect(container.querySelector('.none-selected').textContent).toBe('No concept selected');
        expect(container.querySelector('.concept-pathinfo-container')).toBeNull();
    });

    test('Code set, aka Loading', () => {
        const { container } = render(
            <ConceptPathInfoImpl alternatePathClickHandler={jest.fn()} selectedCode="MagicCode" />
        );
        expect(container.querySelector('.concept-pathinfo-container')).not.toBeNull();
        expect(container.querySelector('.fa-spinner')).not.toBeNull();
        expect(container.querySelector('.alternate-paths-container')).toBeNull();
    });

    test('Loading, Selected path set, alternate paths undefined', () => {
        const path = new PathModel({ path: 'abcd/efg/', label: 'first' });
        const { container } = render(
            <ConceptPathInfoImpl
                alternatePathClickHandler={jest.fn()}
                alternatePaths={undefined}
                selectedCode="MagicCode"
                selectedPath={path}
            />
        );
        expect(container.querySelector('.concept-pathinfo-container')).not.toBeNull();
        expect(container.querySelector('.title').textContent).toBe('first');
        expect(container.querySelector('.fa-spinner')).not.toBeNull();
    });

    test('Selected path set, alternate paths empty', () => {
        const path = new PathModel({ path: 'abcd/efg/', label: 'first' });
        const { container } = render(
            <ConceptPathInfoImpl
                alternatePathClickHandler={jest.fn()}
                alternatePaths={[]}
                selectedCode="MagicCode"
                selectedPath={path}
            />
        );
        expect(container.querySelector('.concept-pathinfo-container')).not.toBeNull();
        expect(container.querySelector('.fa-spinner')).toBeNull();
        expect(container.querySelector('.no-path-info').textContent).toBe('No path information available');
    });

    test('Only selected path', async () => {
        const path = new PathModel({ path: 'abcd/efg/', label: 'first' });
        const { container } = render(
            <ConceptPathInfoImpl
                alternatePathClickHandler={jest.fn()}
                alternatePaths={[path]}
                selectedCode="MagicCode"
                selectedPath={path}
            />
        );
        await waitFor(() => {
            expect(container.querySelector('.current-path-container')).not.toBeNull();
        });
        expect(container.querySelector('.current-path-container .concept-path-container.selected')).not.toBeNull();
        expect(container.querySelector('.alternate-paths-container')).not.toBeNull();
        expect(container.querySelector('.alternate-paths-container .no-path-info').textContent).toBe(
            'No alternate paths'
        );
    });

    test('Selected path and alternate paths', async () => {
        const path1 = new PathModel({ path: 'abcd/efg/', label: 'first' });
        const path2 = new PathModel({ path: '1234/efg/', label: 'second' });
        const path3 = new PathModel({ path: 'abcd/efg/123', label: 'third' });
        const path4 = new PathModel({ path: 'abcd/efg/4', label: 'fourth' });
        const { container } = render(
            <ConceptPathInfoImpl
                alternatePathClickHandler={jest.fn()}
                alternatePaths={[path1, path2, path3, path4]}
                selectedCode="MagicCode"
                selectedPath={path3}
            />
        );
        await waitFor(() => {
            expect(container.querySelector('.current-path-container .concept-path-container.selected')).not.toBeNull();
        });
        expect(container.querySelector('.alternate-paths-container')).not.toBeNull();
        expect(container.querySelectorAll('.alternate-paths-container .concept-path-container')).toHaveLength(3);
        expect(container.querySelector('.alternate-paths-container .no-path-info')).toBeNull();
    });
});

describe('AlternatePathPanel', () => {
    test('no paths', () => {
        const { container } = render(
            <AlternatePathPanel alternatePathClickHandler={jest.fn()} alternatePaths={[]} selectedPath={undefined} />
        );
        expect(container.querySelector('.current-path-container')).toBeNull();
        expect(container.querySelector('.alternate-paths-container')).not.toBeNull();
        expect(container.querySelector('.no-path-info').textContent).toBe('No alternate paths');
    });

    test('with selected path but no alternates', async () => {
        const { container } = render(
            <AlternatePathPanel
                alternatePathClickHandler={jest.fn()}
                alternatePaths={[TEST_SELECTED_PATH]}
                selectedPath={TEST_SELECTED_PATH}
            />
        );
        await waitFor(() => {
            expect(container.querySelector('.current-path-container')).not.toBeNull();
        });
        expect(container.querySelector('.current-path-container .concept-path-container.selected')).not.toBeNull();
        expect(container.querySelector('.alternate-paths-container')).not.toBeNull();
        expect(container.querySelector('.alternate-paths-container .no-path-info').textContent).toBe(
            'No alternate paths'
        );
    });

    test('with selected path and alternate', async () => {
        const { container } = render(
            <AlternatePathPanel
                alternatePathClickHandler={jest.fn()}
                alternatePaths={[TEST_SELECTED_PATH, TEST_ALTERNATE_PATH]}
                selectedPath={TEST_SELECTED_PATH}
            />
        );
        await waitFor(() => {
            expect(container.querySelector('.current-path-container .concept-path-container.selected')).not.toBeNull();
        });
        expect(container.querySelector('.alternate-paths-container .no-path-info')).toBeNull();
        expect(container.querySelectorAll('.alternate-paths-container .concept-path-container')).toHaveLength(1);
    });

    test('with no selected path and alternates', async () => {
        const { container } = render(
            <AlternatePathPanel
                alternatePathClickHandler={jest.fn()}
                alternatePaths={[TEST_SELECTED_PATH, TEST_ALTERNATE_PATH]}
                selectedPath={undefined}
            />
        );
        await waitFor(() => {
            expect(container.querySelector('.current-path-container')).toBeNull();
        });
        expect(container.querySelector('.alternate-paths-container')).not.toBeNull();
        expect(container.querySelector('.alternate-paths-container .no-path-info')).toBeNull();
        expect(container.querySelectorAll('.alternate-paths-container .concept-path-container')).toHaveLength(2);
    });
});
