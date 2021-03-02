import React from 'react';
import { mount } from 'enzyme';

import { FileTree } from '../../..';

import { OntologyTreePanel } from './OntologyTreePanel';
import { PathModel } from './models';

const DEFAULT_PROPS = {
    root: new PathModel({ label: 'test label' }),
    onNodeSelection: jest.fn,
};

describe('OntologyTreePanel', () => {
    test('default props', () => {
        const wrapper = mount(<OntologyTreePanel {...DEFAULT_PROPS} />);
        const fileTree = wrapper.find(FileTree);
        expect(fileTree.prop('allowMultiSelect')).toBe(false);
        expect(fileTree.prop('showNodeIcon')).toBe(false);
        expect(fileTree.prop('defaultRootName')).toBe(DEFAULT_PROPS.root.label);
        wrapper.unmount();
    });
});
