import React from 'react';
import { mount } from 'enzyme';

import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../../test/data/constants';

import { FolderMenu, FolderMenuProps } from './FolderMenu';

describe('FolderMenu', () => {
    function getDefaultProps(): FolderMenuProps {
        return {
            activeContainerId: undefined,
            items: [],
            onClick: jest.fn(),
        };
    }

    it('no projects', () => {
        const wrapper = mount(<FolderMenu {...getDefaultProps()} />);

        expect(wrapper.find('.col-folders')).toHaveLength(1);
        expect(wrapper.find('ul')).toHaveLength(1);
        expect(wrapper.find('li')).toHaveLength(0);
        expect(wrapper.find('.menu-section-header')).toHaveLength(0);
        expect(wrapper.find('.menu-section-item')).toHaveLength(0);
        expect(wrapper.find('.active')).toHaveLength(0);
        expect(wrapper.find('.menu-folder-item')).toHaveLength(0);
        expect(wrapper.find('hr')).toHaveLength(0);

        wrapper.unmount();
    });

    it('with projects, with top level', () => {
        const wrapper = mount(
            <FolderMenu
                {...getDefaultProps()}
                items={[
                    {
                        id: TEST_PROJECT_CONTAINER.id,
                        path: TEST_PROJECT_CONTAINER.path,
                        href: undefined,
                        isTopLevel: true,
                        label: TEST_PROJECT_CONTAINER.title,
                    },
                    {
                        id: TEST_PROJECT_CONTAINER.id,
                        path: TEST_PROJECT_CONTAINER.path,
                        href: undefined,
                        isTopLevel: false,
                        label: TEST_FOLDER_CONTAINER.title,
                    },
                ]}
            />
        );

        expect(wrapper.find('.col-folders')).toHaveLength(1);
        expect(wrapper.find('ul')).toHaveLength(1);
        expect(wrapper.find('li')).toHaveLength(3);
        expect(wrapper.find('.menu-section-header')).toHaveLength(1);
        expect(wrapper.find('.menu-section-item')).toHaveLength(1);
        expect(wrapper.find('.active')).toHaveLength(0);
        expect(wrapper.find('.menu-folder-item')).toHaveLength(2);
        expect(wrapper.find('.menu-folder-item').first().text()).toBe(TEST_PROJECT_CONTAINER.title);
        expect(wrapper.find('.menu-folder-item').last().text()).toBe(TEST_FOLDER_CONTAINER.title);
        expect(wrapper.find('hr')).toHaveLength(1);

        wrapper.unmount();
    });

    it('with projects, without top level', () => {
        const wrapper = mount(
            <FolderMenu
                {...getDefaultProps()}
                items={[
                    {
                        id: TEST_PROJECT_CONTAINER.id,
                        path: TEST_PROJECT_CONTAINER.path,
                        href: undefined,
                        isTopLevel: false,
                        label: TEST_FOLDER_CONTAINER.title,
                    },
                ]}
            />
        );

        expect(wrapper.find('.col-folders')).toHaveLength(1);
        expect(wrapper.find('ul')).toHaveLength(1);
        expect(wrapper.find('li')).toHaveLength(1);
        expect(wrapper.find('.menu-section-header')).toHaveLength(0);
        expect(wrapper.find('.menu-section-item')).toHaveLength(1);
        expect(wrapper.find('.active')).toHaveLength(0);
        expect(wrapper.find('.menu-folder-item')).toHaveLength(1);
        expect(wrapper.find('.menu-folder-item').first().text()).toBe(TEST_FOLDER_CONTAINER.title);
        expect(wrapper.find('hr')).toHaveLength(0);

        wrapper.unmount();
    });

    it('with projects, activeContainerId', () => {
        const wrapper = mount(
            <FolderMenu
                {...getDefaultProps()}
                activeContainerId={TEST_PROJECT_CONTAINER.id}
                items={[
                    {
                        id: TEST_PROJECT_CONTAINER.id,
                        path: TEST_PROJECT_CONTAINER.path,
                        href: undefined,
                        isTopLevel: true,
                        label: TEST_PROJECT_CONTAINER.title,
                    },
                    {
                        id: TEST_PROJECT_CONTAINER.id,
                        path: TEST_PROJECT_CONTAINER.path,
                        href: undefined,
                        isTopLevel: false,
                        label: TEST_FOLDER_CONTAINER.title,
                    },
                ]}
            />
        );

        expect(wrapper.find('.col-folders')).toHaveLength(1);
        expect(wrapper.find('ul')).toHaveLength(1);
        expect(wrapper.find('li')).toHaveLength(3);
        expect(wrapper.find('.menu-section-header')).toHaveLength(1);
        expect(wrapper.find('.menu-section-item')).toHaveLength(1);
        expect(wrapper.find('.active')).toHaveLength(2);
        expect(wrapper.find('.menu-folder-item')).toHaveLength(2);
        expect(wrapper.find('.menu-folder-item').first().text()).toBe(TEST_PROJECT_CONTAINER.title);
        expect(wrapper.find('.menu-folder-item').last().text()).toBe(TEST_FOLDER_CONTAINER.title);
        expect(wrapper.find('hr')).toHaveLength(1);

        wrapper.unmount();
    });
});
