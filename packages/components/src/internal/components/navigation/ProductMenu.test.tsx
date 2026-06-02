/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { createRef } from 'react';
import { waitFor } from '@testing-library/react';
import { List, Map } from 'immutable';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { getTestAPIWrapper } from '../../APIWrapper';
import { TEST_ARCHIVED_FOLDER_CONTAINER, TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';
import { ServerContext } from '../base/ServerContext';
import { FREEZER_MANAGER_APP_PROPERTIES, SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { getSecurityTestAPIWrapper, SecurityAPIWrapper } from '../security/APIWrapper';

import { TEST_LKS_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { Container } from '../base/models/Container';

import { AppContextTestProviderProps } from '../../test/testHelpers';

import { getNavigationTestAPIWrapper } from './NavigationAPIWrapper';

import { FolderMenuItem } from './FolderMenu';

import { MenuSectionConfig, MenuSectionModel, ProductMenuModel } from './model';
import {
    createFolderItem,
    getHeaderMenuSubtitle,
    ProductMenu,
    ProductMenuButton,
    ProductMenuButtonProps,
    ProductMenuButtonTitle,
    ProductMenuProps,
} from './ProductMenu';
import { HOME_PATH, HOME_TITLE } from './constants';

function getDefaultServerContext(): Partial<ServerContext> {
    return {
        container: TEST_PROJECT_CONTAINER,
        moduleContext: TEST_LKS_STARTER_MODULE_CONTEXT,
    };
}

const sampleTypeItems = List<MenuSectionModel>([
    {
        id: 1,
        label: 'Sample Set 1',
    },
    {
        hasActiveJob: true,
        id: 2,
        label: 'Sample Set 2',
    },
    {
        id: 3,
        label: 'Sample Set 3',
    },
    {
        id: 4,
        label: 'Sample Set 4',
    },
]);

const assayItems = List<MenuSectionModel>([
    {
        hasActiveJob: true,
        id: 11,
        label: 'Assay 1',
    },
    {
        id: 12,
        label: 'Assay 2',
    },
    {
        id: 13,
        label: 'Assay 3',
    },
    {
        id: 14,
        label: 'Assay 4',
    },
    {
        id: 15,
        label: 'Assay 5',
    },
]);

const yourItems = List<MenuSectionModel>([
    {
        id: 21,
        label: 'Documentation',
    },
]);

const sections = List.of(
    MenuSectionModel.create({
        label: 'Sample Sets',
        url: undefined,
        items: sampleTypeItems,
        productId: 'samplemanager',
        key: 'samples',
    }),
    MenuSectionModel.create({
        label: 'Assays',
        items: assayItems,
        productId: 'samplemanager',
        key: 'assays',
    }),
    MenuSectionModel.create({
        label: 'Your Items',
        items: yourItems,
        productId: 'samplemanager',
        key: 'user',
    })
);

const model = new ProductMenuModel({
    productIds: ['testProduct'],
    isLoaded: true,
    isLoading: false,
    sections: sections.asImmutable(),
    containerId: TEST_FOLDER_CONTAINER.id,
    containerPath: TEST_FOLDER_CONTAINER.path,
});

let sectionConfigs = List<Map<string, MenuSectionConfig>>().asImmutable();
const samplesSectionConfigs = Map<string, MenuSectionConfig>().set(
    'samples',
    new MenuSectionConfig({
        showActiveJobIcon: false,
        headerURLPart: 'samples',
    })
);
sectionConfigs = sectionConfigs.push(samplesSectionConfigs);
const twoSectionConfig = Map<string, MenuSectionConfig>().set(
    'assays',
    new MenuSectionConfig({
        showActiveJobIcon: true,
        headerURLPart: 'assays',
    })
);
twoSectionConfig.set('user', new MenuSectionConfig({}));
sectionConfigs = sectionConfigs.push(twoSectionConfig);

const HOME_PROJECT = new Container({ id: '12345', path: HOME_PATH, title: 'home' });

describe('ProductMenuButton', () => {
    function defaultProps(): ProductMenuButtonProps {
        return {
            appProperties: SAMPLE_MANAGER_APP_PROPERTIES,
            sectionConfigs,
            showFolderMenu: true,
        };
    }

    function defaultContext(overrides?: Partial<SecurityAPIWrapper>): AppContextTestProviderProps {
        return {
            appContext: {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        fetchContainers: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER]),
                        ...overrides,
                    }),
                }),
            },
            serverContext: getDefaultServerContext(),
        };
    }

    test('default props', async () => {
        renderWithAppContext(<ProductMenuButton {...defaultProps()} />, defaultContext());

        await waitFor(() => {
            expect(document.querySelectorAll('.product-menu-button')).toHaveLength(1);
        });
        expect(document.querySelector('.product-menu-button').getAttribute('aria-expanded')).toBe('false');
        expect(document.querySelectorAll('div.title')).toHaveLength(1);
        expect(document.querySelectorAll('.product-menu-content')).toHaveLength(0);
        expect(document.querySelectorAll('.with-col-folders')).toHaveLength(0);
    });

    test('ProductMenuButtonTitle without items', () => {
        const location = { pathname: '/admin' };
        renderWithAppContext(
            <ProductMenuButtonTitle container={TEST_FOLDER_CONTAINER} folderItems={[]} location={location as any} />,
            defaultContext()
        );

        expect(document.querySelector('div.title')).toHaveTextContent('Menu');
        expect(document.querySelector('.subtitle')).toHaveTextContent('Administration');
    });

    test('ProductMenuButtonTitle with items', () => {
        const location = { pathname: '/items' };
        renderWithAppContext(
            <ProductMenuButtonTitle
                container={TEST_FOLDER_CONTAINER}
                folderItems={[{} as FolderMenuItem, {} as FolderMenuItem]}
                location={location as any}
            />,
            defaultContext()
        );

        expect(document.querySelector('div.title')).toHaveTextContent(TEST_FOLDER_CONTAINER.title);
        expect(document.querySelector('.subtitle')).toHaveTextContent('Storage');
    });

    test('ProductMenuButtonTitle without routes', () => {
        const location = { pathname: '/' };
        renderWithAppContext(
            <ProductMenuButtonTitle
                container={TEST_FOLDER_CONTAINER}
                folderItems={[{} as FolderMenuItem, {} as FolderMenuItem]}
                location={location as any}
            />,
            defaultContext()
        );

        expect(document.querySelector('div.title')).toHaveTextContent(TEST_FOLDER_CONTAINER.title);
        expect(document.querySelector('.subtitle')).toHaveTextContent('Dashboard');
    });

    test('ProductMenuButtonTitle home', () => {
        const location = { pathname: '/' };
        renderWithAppContext(
            <ProductMenuButtonTitle
                container={HOME_PROJECT}
                folderItems={[{} as FolderMenuItem, {} as FolderMenuItem]}
                location={location as any}
            />,
            defaultContext()
        );

        expect(document.querySelector('div.title')).toHaveTextContent(HOME_TITLE);
        expect(document.querySelector('.subtitle')).toHaveTextContent('Dashboard');
    });

    test('ProductMenuButtonTitle archived', () => {
        const location = { pathname: '/' };
        renderWithAppContext(
            <ProductMenuButtonTitle
                container={TEST_ARCHIVED_FOLDER_CONTAINER}
                folderItems={[{} as FolderMenuItem, {} as FolderMenuItem]}
                location={location as any}
            />,
            defaultContext()
        );

        expect(document.querySelector('div.title')).toHaveTextContent(
            TEST_ARCHIVED_FOLDER_CONTAINER.title + 'Archived'
        );
        expect(document.querySelector('.subtitle')).toHaveTextContent('Dashboard');
        expect(document.querySelectorAll('.product-menu_archived-tag')).toHaveLength(1);
    });
});

describe('ProductMenu', () => {
    function defaultContext(): AppContextTestProviderProps {
        return {
            appContext: {
                api: getTestAPIWrapper(jest.fn, {
                    navigation: getNavigationTestAPIWrapper(jest.fn, {
                        initMenuModel: jest.fn().mockResolvedValue(model),
                    }),
                }),
            },
            serverContext: getDefaultServerContext(),
        };
    }

    function defaultProps(): ProductMenuProps {
        return {
            appProperties: SAMPLE_MANAGER_APP_PROPERTIES,
            error: undefined,
            folderItems: [],
            menuRef: createRef(),
            onClick: jest.fn(),
            sectionConfigs,
            showFolderMenu: true,
        };
    }

    async function validate(hasError = false, showFolderMenu = true, contentSections = 2): Promise<void> {
        await waitFor(() => {
            expect(document.querySelectorAll('.product-menu-content')).toHaveLength(1);
        });
        expect(document.querySelectorAll('.navbar-connector')).toHaveLength(1);
        expect(document.querySelectorAll('.alert')).toHaveLength(hasError ? 1 : 0);
        expect(document.querySelectorAll('.menu-section.col-folders')).toHaveLength(showFolderMenu ? 1 : 0);
        expect(document.querySelectorAll('.sections-content')).toHaveLength(1);
        expect(document.querySelectorAll('.menu-section')).toHaveLength(contentSections + (showFolderMenu ? 1 : 0));
        expect(document.querySelectorAll('.col-product-section')).toHaveLength(contentSections);
        expect(document.querySelectorAll('.product-menu-section-header')).toHaveLength(contentSections);
    }

    test('default props', async () => {
        renderWithAppContext(<ProductMenu {...defaultProps()} />, defaultContext());
        await validate();
    });

    test('error', async () => {
        renderWithAppContext(<ProductMenu {...defaultProps()} error="Test Error" />, defaultContext());
        await validate(true);
    });

    test('showFolderMenu false', async () => {
        renderWithAppContext(<ProductMenu {...defaultProps()} showFolderMenu={false} />, defaultContext());
        await validate(false, false);
    });
});

describe('createFolderItem', () => {
    test('default props', () => {
        const item = createFolderItem(TEST_FOLDER_CONTAINER, 'controller', true);
        expect(item.id).toBe(TEST_FOLDER_CONTAINER.id);
        expect(item.label).toBe(TEST_FOLDER_CONTAINER.title);
        expect(item.path).toBe(TEST_FOLDER_CONTAINER.path);
        expect(item.isTopLevel).toBe(true);
        expect(item.href).toBe('/labkey/TestProjectContainer/TestFolderContainer/controller-app.view');
        expect(item.archived).toBeFalsy();
    });

    test('archived folder', () => {
        const item = createFolderItem(TEST_ARCHIVED_FOLDER_CONTAINER, 'controller', true);
        expect(item.id).toBe(TEST_ARCHIVED_FOLDER_CONTAINER.id);
        expect(item.label).toBe(TEST_ARCHIVED_FOLDER_CONTAINER.title);
        expect(item.path).toBe(TEST_ARCHIVED_FOLDER_CONTAINER.path);
        expect(item.isTopLevel).toBe(true);
        expect(item.href).toBe('/labkey/TestProjectContainer/ArchiveFolderContainer/controller-app.view');
        expect(item.archived).toBeTruthy();
    });

    test('home project', () => {
        const item = createFolderItem(HOME_PROJECT, 'controller', true);
        expect(item.id).toBe(HOME_PROJECT.id);
        expect(item.label).toBe(HOME_TITLE);
        expect(item.path).toBe(HOME_PROJECT.path);
        expect(item.isTopLevel).toBe(true);
        expect(item.href).toBe('/labkey/home/controller-app.view');
        expect(item.archived).toBeFalsy();
    });
});

describe('getHeaderMenuSubtitle', () => {
    test('default', () => {
        expect(getHeaderMenuSubtitle(undefined)).toBe('Dashboard');
        expect(getHeaderMenuSubtitle(null)).toBe('Dashboard');
        expect(getHeaderMenuSubtitle('')).toBe('Dashboard');
        expect(getHeaderMenuSubtitle('bogus')).toBe('Dashboard');
    });

    test('mapping', () => {
        expect(getHeaderMenuSubtitle('/account')).toBe('Settings');
        expect(getHeaderMenuSubtitle('/assayDesign')).toBe('Assays');
        expect(getHeaderMenuSubtitle('/assaydesign')).toBe('Assays');
        expect(getHeaderMenuSubtitle('/sampleType')).toBe('Sample Types');
        expect(getHeaderMenuSubtitle('/sampleType')).toBe('Sample Types');
        expect(getHeaderMenuSubtitle('/freezers')).toBe('Storage');
    });

    test('AppProperties mapping', () => {
        expect(getHeaderMenuSubtitle(undefined, undefined)).toBe('Dashboard');
        expect(getHeaderMenuSubtitle(undefined, null)).toBe('Dashboard');
        expect(getHeaderMenuSubtitle(undefined, SAMPLE_MANAGER_APP_PROPERTIES)).toBe('Dashboard');
        expect(getHeaderMenuSubtitle(undefined, FREEZER_MANAGER_APP_PROPERTIES)).toBe('Storage');
        expect(getHeaderMenuSubtitle('/home', SAMPLE_MANAGER_APP_PROPERTIES)).toBe('Dashboard');
        expect(getHeaderMenuSubtitle('/home', FREEZER_MANAGER_APP_PROPERTIES)).toBe('Storage');
    });
});
