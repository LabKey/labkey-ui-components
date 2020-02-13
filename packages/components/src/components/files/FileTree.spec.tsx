import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { FileTree } from '../..';

import { fetchFileTestTree } from './FileTreeTest';

describe('<FileTree/>', () => {
    const waitForLoad = jest.fn(component => Promise.resolve(!component.state().loading));

    test('with data', () => {
        const tree = shallow(
            <FileTree
                loadData={fetchFileTestTree}
                onFileSelect={(name: string, path: string, checked: boolean, isDirectory: boolean) => {}}
            />
            );

        return waitForLoad(tree).then(() => {
            const node = tree
                .childAt(0)
                .dive()
                .childAt(0)
                .dive()
                .find('NodeHeader');
            expect(node.prop('node').children.length).toEqual(0);

            node.simulate('click');

            return waitForLoad(tree).then(() => {
                expect(node.prop('node').children.length).toEqual(4);
                expect(toJson(tree)).toMatchSnapshot();
                tree.unmount();
            });
        });
    });
});
