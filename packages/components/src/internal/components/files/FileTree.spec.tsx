import React from 'react';
import { Checkbox } from 'react-bootstrap';
import { mount, ReactWrapper, shallow } from 'enzyme';
import renderer from 'react-test-renderer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFileAlt, faFolderOpen } from '@fortawesome/free-solid-svg-icons';

import { LoadingSpinner } from '../../..';

import { FileTree, NodeIcon, Header, EMPTY_FILE_NAME, LOADING_FILE_NAME } from './FileTree';
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
                expect(renderer.create(tree.getElement())).toMatchSnapshot();
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
                expect(renderer.create(tree.getElement())).toMatchSnapshot();
                tree.unmount();
            });
        });
    });
});

describe('NodeIcon', () => {
    const DEFAULT_PROPS = {
        isDirectory: false,
        useFileIconCls: false,
        node: {},
    };

    test('default props', () => {
        const wrapper = mount(<NodeIcon {...DEFAULT_PROPS} />);
        expect(wrapper.find('i')).toHaveLength(0);
        expect(wrapper.find(FontAwesomeIcon)).toHaveLength(1);
        expect(wrapper.find(FontAwesomeIcon).prop('icon')).toBe(faFileAlt);
        wrapper.unmount();
    });

    test('isDirectory', () => {
        const wrapper = mount(<NodeIcon {...DEFAULT_PROPS} isDirectory={true} />);
        expect(wrapper.find('i')).toHaveLength(0);
        expect(wrapper.find(FontAwesomeIcon)).toHaveLength(1);
        expect(wrapper.find(FontAwesomeIcon).prop('icon')).toBe(faFolder);
        wrapper.unmount();
    });

    test('isDirectory toggled', () => {
        const wrapper = mount(<NodeIcon {...DEFAULT_PROPS} isDirectory node={{toggled: true}} />);
        expect(wrapper.find('i')).toHaveLength(0);
        expect(wrapper.find(FontAwesomeIcon)).toHaveLength(1);
        expect(wrapper.find(FontAwesomeIcon).prop('icon')).toBe(faFolderOpen);
        wrapper.unmount();
    });

    test('useFileIconCls and iconFontCls', () => {
        let wrapper = mount(<NodeIcon {...DEFAULT_PROPS} useFileIconCls />);
        expect(wrapper.find('i')).toHaveLength(0);
        expect(wrapper.find(FontAwesomeIcon)).toHaveLength(1);
        expect(wrapper.find(FontAwesomeIcon).prop('className')).toBe('filetree-folder-icon');
        wrapper.unmount();

        wrapper = mount(<NodeIcon {...DEFAULT_PROPS} useFileIconCls node={{ data: { iconFontCls: 'test-cls' } }} />);
        expect(wrapper.find('i')).toHaveLength(1);
        expect(wrapper.find(FontAwesomeIcon)).toHaveLength(0);
        expect(wrapper.find('i').prop('className')).toBe('test-cls filetree-folder-icon');
        wrapper.unmount();
    });
});

describe('Header', () => {
    const DEFAULT_PROPS = {
        node: { id: 'test-id', active: false, children: undefined, name: 'test name' },
        style: { base: {} },
        showNodeIcon: true,
    };

    function validate(
        wrapper: ReactWrapper,
        isEmpty = false,
        loading = false,
        hasCheckbox = false,
        showNodeIcon = true,
        isDirectory = false
    ): void {
        expect(wrapper.find('.filetree-empty-directory')).toHaveLength(isEmpty ? 1 : 0);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(loading ? 1 : 0);

        const rendered = !isEmpty && !loading;
        expect(wrapper.find('.filetree-checkbox-container')).toHaveLength(rendered ? 1 : 0);
        expect(wrapper.find(Checkbox)).toHaveLength(rendered && hasCheckbox ? 1 : 0);
        expect(wrapper.find('.filetree-resource-row')).toHaveLength(rendered ? 1 : 0);
        expect(wrapper.find(NodeIcon)).toHaveLength(rendered && showNodeIcon ? 1 : 0);
        expect(wrapper.find('.filetree-file-name')).toHaveLength(rendered && !isDirectory ? 1 : 0);
        expect(wrapper.find('.filetree-directory-name')).toHaveLength(rendered && isDirectory ? 1 : 0);
    }

    test('file node, no checkbox', () => {
        const wrapper = mount(<Header {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find('.filetree-leaf-node')).toHaveLength(1);
        expect(wrapper.find('.active')).toHaveLength(0);
        expect(wrapper.find('.filetree-resource-row').prop('title')).toBe('test name');
        expect(wrapper.find('.filetree-file-name').text()).toBe('test name');
        wrapper.unmount();
    });

    test('file node, with checkbox', () => {
        const wrapper = mount(<Header {...DEFAULT_PROPS} handleCheckbox={jest.fn} />);
        validate(wrapper, false, false, true);
        wrapper.unmount();
    });

    test('directory node', () => {
        const wrapper = mount(
            <Header {...DEFAULT_PROPS} node={{ id: 'test-id', active: false, children: [], name: 'test name' }} />
        );
        validate(wrapper, false, false, false, true, true);
        expect(wrapper.find('.filetree-leaf-node')).toHaveLength(0);
        wrapper.unmount();
    });

    test('showNodeIcon false', () => {
        const wrapper = mount(<Header {...DEFAULT_PROPS} showNodeIcon={false} />);
        validate(wrapper, false, false, false, false);
        wrapper.unmount();
    });

    test('active and not allowMultiSelect', () => {
        const wrapper = mount(
            <Header {...DEFAULT_PROPS} node={{ id: 'test-id', active: true, children: undefined, name: 'test name' }} />
        );
        validate(wrapper);
        expect(wrapper.find('.active')).toHaveLength(1);
        expect(wrapper.find('.lk-text-theme-dark')).toHaveLength(1);
        wrapper.unmount();
    });

    test('active and allowMultiSelect', () => {
        const wrapper = mount(
            <Header
                {...DEFAULT_PROPS}
                node={{ id: 'test-id', active: true, children: undefined, name: 'test name' }}
                allowMultiSelect
            />
        );
        validate(wrapper);
        expect(wrapper.find('.active')).toHaveLength(1);
        expect(wrapper.find('.lk-text-theme-dark')).toHaveLength(0);
        wrapper.unmount();
    });

    test('empty node', () => {
        const wrapper = mount(<Header {...DEFAULT_PROPS} node={{ id: 'test|' + EMPTY_FILE_NAME }} />);
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('loading node', () => {
        const wrapper = mount(<Header {...DEFAULT_PROPS} node={{ id: 'test|' + LOADING_FILE_NAME }} />);
        validate(wrapper, true, true);
        wrapper.unmount();
    });

    test('customStyles and not selected', () => {
        const title = { fontWeight: 'normal' };
        const customTitle = { fontWeight: 'bold' };
        const wrapper = mount(
            <Header
                {...DEFAULT_PROPS}
                node={{
                    id: 'test-id',
                    active: false,
                    children: undefined,
                    name: 'test name',
                    selected: false,
                }}
                style={{ base: {}, title }}
                customStyles={{ header: { title: customTitle } }}
            />
        );
        validate(wrapper);
        expect(wrapper.find('.filetree-resource-row').prop('style')).toStrictEqual(title);
        wrapper.unmount();
    });

    test('customStyles and selected', () => {
        const title = { fontWeight: 'normal' };
        const customTitle = { fontWeight: 'bold' };
        const wrapper = mount(
            <Header
                {...DEFAULT_PROPS}
                node={{
                    id: 'test-id',
                    active: false,
                    children: undefined,
                    name: 'test name',
                    selected: true,
                    style: { base: {}, title },
                }}
                customStyles={{ header: { title: customTitle } }}
            />
        );
        validate(wrapper);
        expect(wrapper.find('.filetree-resource-row').prop('style')).toStrictEqual(customTitle);
        wrapper.unmount();
    });
});
