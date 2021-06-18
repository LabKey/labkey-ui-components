import React from 'react';
import { mount } from 'enzyme';

import { FileTree } from '../../..';

import { FilterIcon, OntologyTreePanel } from './OntologyTreePanel';
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
        expect(fileTree.prop('showLoading')).toBe(false);
        expect(fileTree.prop('showAnimations')).toBe(false);
        wrapper.unmount();
    });
});

const DEFAULT_FILTER_ICON_PROPS = {
    node: undefined,
    onClick: undefined,
    filters: undefined,
}

describe('FilterIcon', () => {
    test('default props', () => {
        const wrapper = mount(<FilterIcon {...DEFAULT_FILTER_ICON_PROPS} />);
        const icon = wrapper.find('i');
        expect(icon.prop('className')).toBe('fa fa-filter');
        wrapper.unmount();
    });

    test('node selected', () => {
        const testnode = {data:{code:'test'}};
        const testFilters = new Map<string, PathModel>().set('test', new PathModel());

        const wrapper = mount(<FilterIcon node={testnode} filters={testFilters} />);
        const icon = wrapper.find('i');
        expect(icon.prop('className')).toBe('fa fa-filter selected');
        expect(icon.prop('title')).toBe('Remove filter');
        wrapper.unmount();
    });

    test('node not selected', () => {
        const testnode = {data:{code:'test'}};
        const testFilters = new Map<string, PathModel>().set('nope', new PathModel());

        const wrapper = mount(<FilterIcon node={testnode} filters={testFilters} />);
        const icon = wrapper.find('i');
        expect(icon.prop('className')).toBe('fa fa-filter');
        expect(icon.prop('title')).toBe('Add filter');
        wrapper.unmount();
    });

    test('clicked', () => {
        const testdata = {code:'test'};
        const testnode = {data:testdata};
        const onClickHandler = jest.fn();

        const wrapper = mount(<FilterIcon node={testnode} onClick={onClickHandler} />);
        const icon = wrapper.find('i');
        expect(icon.prop('className')).toBe('fa fa-filter');
        wrapper.simulate('click');
        expect(onClickHandler).toBeCalledTimes(1);
        expect(onClickHandler).toHaveBeenCalledWith(testdata);

        wrapper.unmount();
    });
});
