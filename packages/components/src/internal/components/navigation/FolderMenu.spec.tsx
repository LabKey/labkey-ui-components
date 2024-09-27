import React from 'react';

import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { mountWithServerContext } from '../../test/enzymeTestHelpers';

import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR } from '../../userFixtures';

import { TEST_LIMS_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { FolderMenu, FolderMenuProps } from './FolderMenu';

describe('FolderMenu', () => {
    function getDefaultProps(): FolderMenuProps {
        return {
            activeContainerId: undefined,
            items: [],
            onClick: jest.fn(),
        };
    }

    it('no folders', () => {
        const wrapper = mountWithServerContext(<FolderMenu {...getDefaultProps()} />, {
            user: TEST_USER_APP_ADMIN,
            moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT,
        });

        expect(wrapper.find('.col-folders')).toHaveLength(1);
        expect(wrapper.find('ul')).toHaveLength(1);
        expect(wrapper.find('li')).toHaveLength(0);
        expect(wrapper.find('.menu-section-header')).toHaveLength(0);
        expect(wrapper.find('.menu-section-item')).toHaveLength(0);
        expect(wrapper.find('.active')).toHaveLength(0);
        expect(wrapper.find('.menu-folder-item')).toHaveLength(0);
        expect(wrapper.find('.menu-folder-icons')).toHaveLength(0);
        expect(wrapper.find('.fa-home')).toHaveLength(0);
        expect(wrapper.find('.fa-gear')).toHaveLength(0);
        expect(wrapper.find('hr')).toHaveLength(0);

        wrapper.unmount();
    });

    it('with folders, with top level', () => {
        const wrapper = mountWithServerContext(
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
            />,
            { user: TEST_USER_APP_ADMIN, moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT }
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
        expect(wrapper.find('.menu-folder-icons')).toHaveLength(2);
        expect(wrapper.find('.fa-home')).toHaveLength(2);
        expect(wrapper.find('.fa-gear')).toHaveLength(2);
        expect(wrapper.find('hr')).toHaveLength(1);

        wrapper.unmount();
    });

    it('with folders, without top level', () => {
        const wrapper = mountWithServerContext(
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
            />,
            { user: TEST_USER_APP_ADMIN, moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT }
        );

        expect(wrapper.find('.col-folders')).toHaveLength(1);
        expect(wrapper.find('ul')).toHaveLength(1);
        expect(wrapper.find('li')).toHaveLength(1);
        expect(wrapper.find('.menu-section-header')).toHaveLength(0);
        expect(wrapper.find('.menu-section-item')).toHaveLength(1);
        expect(wrapper.find('.active')).toHaveLength(0);
        expect(wrapper.find('.menu-folder-item')).toHaveLength(1);
        expect(wrapper.find('.menu-folder-item').first().text()).toBe(TEST_FOLDER_CONTAINER.title);
        expect(wrapper.find('.menu-folder-icons')).toHaveLength(1);
        expect(wrapper.find('.fa-home')).toHaveLength(1);
        expect(wrapper.find('.fa-gear')).toHaveLength(1);
        expect(wrapper.find('hr')).toHaveLength(0);

        wrapper.unmount();
    });

    it('with folders, activeContainerId', () => {
        const wrapper = mountWithServerContext(
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
            />,
            { user: TEST_USER_APP_ADMIN, moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT }
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
        expect(wrapper.find('.menu-folder-icons')).toHaveLength(2);
        expect(wrapper.find('.fa-home')).toHaveLength(2);
        expect(wrapper.find('.fa-gear')).toHaveLength(2);
        expect(wrapper.find('hr')).toHaveLength(1);

        wrapper.unmount();
    });

    it('with folders, non admin', () => {
        const wrapper = mountWithServerContext(
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
            />,
            { user: TEST_USER_EDITOR, moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT }
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
        expect(wrapper.find('.menu-folder-icons')).toHaveLength(2);
        expect(wrapper.find('.fa-home')).toHaveLength(2);
        expect(wrapper.find('.fa-gear')).toHaveLength(0);
        expect(wrapper.find('hr')).toHaveLength(1);

        wrapper.unmount();
    });
});
