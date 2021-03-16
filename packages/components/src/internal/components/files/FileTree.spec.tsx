import React from 'react';
import { mount, ReactWrapper, shallow } from 'enzyme';
import renderer from 'react-test-renderer';
import { Treebeard, animations } from 'react-treebeard';

import { LoadingSpinner } from '../../..';

import { FileTree } from './FileTree';
import { fetchFileTestTree } from './FileTreeTest';

const waitForLoad = jest.fn(component => Promise.resolve(!component.state().loading));

describe('FileTree', () => {
    test('with data', () => {
        const component = <FileTree loadData={fetchFileTestTree} onFileSelect={jest.fn()} />;
        const tree = shallow(component);

        return waitForLoad(tree).then(() => {
            const node = tree.childAt(0).dive().childAt(0).dive().find('NodeHeader');
            expect(node.prop('node')['children'].length).toEqual(0);

            node.simulate('click');

            return waitForLoad(tree).then(() => {
                expect(tree.state()['data']['children'].length).toEqual(4);
                expect(renderer.create(tree.getElement()).toJSON()).toMatchSnapshot();
                tree.unmount();
            });
        });
    });

    test('with data allowMultiSelect false', () => {
        const component = (
            <FileTree allowMultiSelect={false} loadData={fetchFileTestTree} onFileSelect={jest.fn(() => true)} />
        );
        const tree = shallow(component);

        return waitForLoad(tree).then(() => {
            const node = tree.childAt(0).dive().childAt(0).dive().find('NodeHeader');
            expect(node.prop('node')['children'].length).toEqual(0);

            node.simulate('click');

            return waitForLoad(tree).then(() => {
                expect(tree.state()['data']['children'].length).toEqual(4);
                expect(renderer.create(tree.getElement()).toJSON()).toMatchSnapshot();
                tree.unmount();
            });
        });
    });

    function validate(wrapper: ReactWrapper, loading = false): void {
        expect(wrapper.find(LoadingSpinner)).toHaveLength(loading ? 1 : 0);
        expect(wrapper.find(Treebeard)).toHaveLength(!loading ? 1 : 0);
    }

    test('showLoading', () => {
        const wrapper = mount(
            <FileTree loadData={fetchFileTestTree} onFileSelect={jest.fn(() => true)} showLoading={true} />
        );
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('showAnimations', () => {
        let wrapper = mount(
            <FileTree loadData={fetchFileTestTree} onFileSelect={jest.fn(() => true)} showAnimations={true} />
        );
        validate(wrapper);
        expect(wrapper.find(Treebeard).prop('animations')).toBe(animations);
        wrapper.unmount();

        wrapper = mount(
            <FileTree loadData={fetchFileTestTree} onFileSelect={jest.fn(() => true)} showAnimations={false} />
        );
        validate(wrapper);
        expect(wrapper.find(Treebeard).prop('animations')).toBe(false);
        wrapper.unmount();
    });
});
