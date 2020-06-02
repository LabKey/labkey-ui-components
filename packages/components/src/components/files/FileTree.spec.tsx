import React from 'react';
import { shallow } from 'enzyme';
import renderer from 'react-test-renderer';

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
        const component = <FileTree allowMultiSelect={false} loadData={fetchFileTestTree} onFileSelect={jest.fn()} />;
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
});
