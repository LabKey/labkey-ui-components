import React, { createRef } from 'react';
import { ReactWrapper } from 'enzyme';
import { List, Map } from 'immutable';

import { AppContext } from '../../AppContext';

import { getTestAPIWrapper } from '../../APIWrapper';
import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';
import { ServerContext } from '../base/ServerContext';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';

import { Alert } from '../base/Alert';

import { getSecurityTestAPIWrapper, SecurityAPIWrapper } from '../security/APIWrapper';

import { TEST_LKS_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { Container } from '../base/models/Container';

import { getNavigationTestAPIWrapper, NavigationAPIWrapper } from './NavigationAPIWrapper';

import { FolderMenu, FolderMenuItem } from './FolderMenu';
import { ProductMenuSection } from './ProductMenuSection';

import { MenuSectionModel, ProductMenuModel, MenuSectionConfig } from './model';
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
        moduleContext: { ...TEST_LKS_STARTER_MODULE_CONTEXT },
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
        key: 'samples',
    }),
    MenuSectionModel.create({
        label: 'Assays',
        items: assayItems,
        key: 'assays',
    }),
    MenuSectionModel.create({
        label: 'Your Items',
        items: yourItems,
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
        iconCls: 'test-icon-cls',
        showActiveJobIcon: false,
    })
);
sectionConfigs = sectionConfigs.push(samplesSectionConfigs);
const twoSectionConfig = Map<string, MenuSectionConfig>().set(
    'assays',
    new MenuSectionConfig({
        iconCls: 'test-icon-cls',
        showActiveJobIcon: true,
    })
);
twoSectionConfig.set(
    'user',
    new MenuSectionConfig({
        iconCls: 'test-icon-cls',
    })
);
sectionConfigs = sectionConfigs.push(twoSectionConfig);

const HOME_PROJECT = new Container({ id: '12345', path: HOME_PATH, title: 'home' });

describe('ProductMenuButton', () => {
    function getDefaultAppContext(overrides?: Partial<SecurityAPIWrapper>): Partial<AppContext> {
        return {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchContainers: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER]),
                    ...overrides,
                }),
            }),
        };
    }

    function getDefaultProps(): ProductMenuButtonProps {
        return {
            appProperties: SAMPLE_MANAGER_APP_PROPERTIES,
            sectionConfigs,
            showFolderMenu: true,
        };
    }

    function validate(wrapper: ReactWrapper) {
        expect(wrapper.find('.product-menu-button')).toHaveLength(1);
        expect(wrapper.find('button').prop('aria-expanded')).toBe(false);
        expect(wrapper.find(ProductMenuButtonTitle)).toHaveLength(1);
        expect(wrapper.find(ProductMenu)).toHaveLength(0);
        expect(wrapper.find('.with-col-folders')).toHaveLength(0);
    }

    test('default props', async () => {
        const wrapper = mountWithAppServerContext(
            <ProductMenuButton {...getDefaultProps()} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        wrapper.unmount();
    });

    test('ProductMenuButtonTitle without items', async () => {
        const location = { pathname: '/admin' };
        const wrapper = mountWithAppServerContext(
            <ProductMenuButtonTitle container={TEST_FOLDER_CONTAINER} folderItems={[]} location={location as any} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.title').text()).toBe('Menu');
        expect(wrapper.find('.subtitle').text()).toBe('Administration');
        wrapper.unmount();
    });

    test('ProductMenuButtonTitle with items', async () => {
        const location = { pathname: '/items' };
        const wrapper = mountWithAppServerContext(
            <ProductMenuButtonTitle
                container={TEST_FOLDER_CONTAINER}
                folderItems={[{} as FolderMenuItem, {} as FolderMenuItem]}
                location={location as any}
            />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.title').text()).toBe(TEST_FOLDER_CONTAINER.title);
        expect(wrapper.find('.subtitle').text()).toBe('Storage');
        wrapper.unmount();
    });

    test('ProductMenuButtonTitle without routes', async () => {
        const location = { pathname: '/' };
        const wrapper = mountWithAppServerContext(
            <ProductMenuButtonTitle
                container={TEST_FOLDER_CONTAINER}
                folderItems={[{} as FolderMenuItem, {} as FolderMenuItem]}
                location={location as any}
            />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.title').text()).toBe(TEST_FOLDER_CONTAINER.title);
        expect(wrapper.find('.subtitle').text()).toBe('Dashboard');
        wrapper.unmount();
    });

    test('ProductMenuButtonTitle home', async () => {
        const location = { pathname: '/' };
        const wrapper = mountWithAppServerContext(
            <ProductMenuButtonTitle
                container={HOME_PROJECT}
                folderItems={[{} as FolderMenuItem, {} as FolderMenuItem]}
                location={location as any}
            />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.title').text()).toBe(HOME_TITLE);
        expect(wrapper.find('.subtitle').text()).toBe('Dashboard');
        wrapper.unmount();
    });
});

describe('ProductMenu', () => {
    function getDefaultAppContext(overrides?: Partial<NavigationAPIWrapper>): Partial<AppContext> {
        return {
            api: getTestAPIWrapper(jest.fn, {
                navigation: getNavigationTestAPIWrapper(jest.fn, {
                    initMenuModel: jest.fn().mockResolvedValue(model),
                    ...overrides,
                }),
            }),
        };
    }

    function getDefaultProps(): ProductMenuProps {
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

    function validate(wrapper: ReactWrapper, hasError = false, showFolderMenu = true, contentSections = 2): void {
        expect(wrapper.find('.product-menu-content')).toHaveLength(1);
        expect(wrapper.find('.navbar-connector')).toHaveLength(1);
        expect(wrapper.find(Alert)).toHaveLength(hasError ? 1 : 0);
        expect(wrapper.find(FolderMenu)).toHaveLength(showFolderMenu ? 1 : 0);
        expect(wrapper.find('.sections-content')).toHaveLength(1);
        expect(wrapper.find('.menu-section')).toHaveLength(contentSections + (showFolderMenu ? 1 : 0));
        expect(wrapper.find('.col-product-section')).toHaveLength(contentSections);
        expect(wrapper.find(ProductMenuSection)).toHaveLength(contentSections);
    }

    test('default props', async () => {
        const wrapper = mountWithAppServerContext(
            <ProductMenu {...getDefaultProps()} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );

        await waitForLifecycle(wrapper);
        validate(wrapper);
        wrapper.unmount();
    });

    test('error', async () => {
        const wrapper = mountWithAppServerContext(
            <ProductMenu {...getDefaultProps()} error="Test Error" />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );

        await waitForLifecycle(wrapper);
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('showFolderMenu false', async () => {
        const wrapper = mountWithAppServerContext(
            <ProductMenu {...getDefaultProps()} showFolderMenu={false} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );

        await waitForLifecycle(wrapper);
        validate(wrapper, false, false);
        wrapper.unmount();
    });

    test('activeContainerId', async () => {
        const wrapper = mountWithAppServerContext(
            <ProductMenu {...getDefaultProps()} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );

        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(FolderMenu).prop('activeContainerId')).toBe(TEST_FOLDER_CONTAINER.id);
        wrapper.unmount();
    });
});

describe('createFolderItem', () => {
    test('default props', () => {
        const item = createFolderItem(TEST_FOLDER_CONTAINER, 'controller', true);
        expect(item.id).toBe(TEST_FOLDER_CONTAINER.id);
        expect(item.label).toBe(TEST_FOLDER_CONTAINER.title);
        expect(item.path).toBe(TEST_FOLDER_CONTAINER.path);
        expect(item.isTopLevel).toBe(true);
        expect(item.href).toBe('/labkey/controller/TestProjectContainer/TestFolderContainer/app.view');
    });

    test('home project', () => {
        const item = createFolderItem(HOME_PROJECT, 'controller', true);
        expect(item.id).toBe(HOME_PROJECT.id);
        expect(item.label).toBe(HOME_TITLE);
        expect(item.path).toBe(HOME_PROJECT.path);
        expect(item.isTopLevel).toBe(true);
        expect(item.href).toBe('/labkey/controller/home/app.view');
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
    });
});
