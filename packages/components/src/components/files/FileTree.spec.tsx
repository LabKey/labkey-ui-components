import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import { FileTree } from './FileTree';
import { fetchFileTestTree } from './FileTreeTest';

const waitForLoad = jest.fn(component => Promise.resolve(!component.state().loading));

describe('FileTree', () => {
    test('with data', () => {
        const tree = shallow(<FileTree loadData={fetchFileTestTree} onFileSelect={jest.fn()} />);

        return waitForLoad(tree).then(() => {
            const node = tree.childAt(0).dive().childAt(0).dive().find('NodeHeader');
            expect(node.prop('node')['children'].length).toEqual(0);

            node.simulate('click');

            return waitForLoad(tree).then(() => {
                expect(tree.state()['data']['children'].length).toEqual(4);
                expect(toJson(tree)).toMatchSnapshot();
                tree.unmount();
            });
        });
    });
});
