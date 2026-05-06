import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { FilterIcon, OntologyTreePanel } from './OntologyTreePanel';
import { PathModel } from './models';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchChildPaths: jest.fn().mockResolvedValue({ children: [] }),
    fetchParentPaths: jest.fn().mockResolvedValue([]),
}));

jest.mock('../files/FileTree', () => {
    // Declaring as a class since functional components do not receive refs (which FileTree does)
    class mockFileTree extends React.PureComponent {
        render() {
            return <div className="mock-file-tree" />;
        }
    }

    return {
        DEFAULT_ROOT_PREFIX: '|root',
        FileTree: mockFileTree,
    };
});

const DEFAULT_PROPS = {
    root: new PathModel({ label: 'test label' }),
    onNodeSelection: jest.fn(),
};

describe('OntologyTreePanel', () => {
    test('default props', () => {
        const { container } = render(<OntologyTreePanel {...DEFAULT_PROPS} />);
        expect(container.querySelector('.mock-file-tree')).not.toBeNull();
    });
});

const DEFAULT_FILTER_ICON_PROPS = {
    node: undefined,
    onClick: undefined,
    filters: undefined,
};

describe('FilterIcon', () => {
    test('default props', () => {
        const { container } = render(<FilterIcon {...DEFAULT_FILTER_ICON_PROPS} />);
        const icon = container.querySelector('i');
        expect(icon.className).toBe('fa fa-filter');
    });

    test('node selected', () => {
        const testnode = { data: { code: 'test' } };
        const testFilters = new Map<string, PathModel>().set('test', new PathModel());
        const { container } = render(<FilterIcon filters={testFilters} node={testnode} />);
        const icon = container.querySelector('i');
        expect(icon.className).toBe('fa fa-filter selected');
        expect(icon.title).toBe('Remove filter');
    });

    test('node not selected', () => {
        const testnode = { data: { code: 'test' } };
        const testFilters = new Map<string, PathModel>().set('nope', new PathModel());
        const { container } = render(<FilterIcon filters={testFilters} node={testnode} />);
        const icon = container.querySelector('i');
        expect(icon.className).toBe('fa fa-filter');
        expect(icon.title).toBe('Add filter');
    });

    test('clicked', () => {
        const testdata = { code: 'test' };
        const testnode = { data: testdata };
        const onClickHandler = jest.fn();
        const { container } = render(<FilterIcon node={testnode} onClick={onClickHandler} />);
        const icon = container.querySelector('i');
        expect(icon.className).toBe('fa fa-filter');
        fireEvent.click(icon);
        expect(onClickHandler).toHaveBeenCalledTimes(1);
        expect(onClickHandler).toHaveBeenCalledWith(testdata);
    });
});
