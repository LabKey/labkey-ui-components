/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { List } from 'immutable';

import { AppURL } from '../../url/AppURL';

import { mountWithServerContext } from '../../test/enzymeTestHelpers';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { ProductMenuSection } from './ProductMenuSection';
import { MenuSectionModel, MenuSectionConfig } from './model';
import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

describe('ProductMenuSection render', () => {
    const sampleSetItems = List<MenuSectionModel>([
        {
            id: 1,
            label: 'Sample Set 1',
        },
        {
            id: 2,
            label: 'Sample Set 2',
            hasActiveJob: true,
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

    const sampleSetItemsAllHidden = List<MenuSectionModel>([
        {
            id: 1,
            label: 'Sample Set 1',
            hidden: true,
        },
        {
            id: 2,
            label: 'Sample Set 2',
            hasActiveJob: true,
            hidden: true,
        },
    ]);

    const sampleSetItemsSomeHidden = List<MenuSectionModel>([
        {
            id: 1,
            label: 'Sample Set 1',
        },
        {
            id: 2,
            label: 'Sample Set 2',
            hasActiveJob: true,
            hidden: true,
        },
    ]);

    const assayItems = List<MenuSectionModel>([
        {
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

    function getDefaultServerContext() {
        return {
            container: TEST_PROJECT_CONTAINER,
            moduleContext: {
                api: {
                    moduleNames: ['samplemanagement', 'premium'],
                },
                samplemanagement: { productId: SAMPLE_MANAGER_APP_PROPERTIES.productId },
            },
        };
    }

    test('empty section no text', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
        });

        const menuSection = mountWithServerContext(
            <ProductMenuSection
                containerPath="/test/path"
                currentProductId="testProduct"
                section={section}
                config={
                    new MenuSectionConfig({
                        iconURL: '/testProduct/images/samples.svg',
                    })
                }
            />,
            getDefaultServerContext()
        );

        expect(menuSection.find('li').length).toBe(2); // header and hr
        expect(menuSection).toMatchSnapshot();
    });

    test('empty section with empty text and create link', () => {
        const config = new MenuSectionConfig({
            emptyText: 'Test empty text',
            filteredEmptyText: 'Empty due to exclusion',
            emptyURL: AppURL.create('sample', 'new'),
            emptyURLText: 'Test empty link',
            iconURL: '/testProduct/images/samples.svg',
        });
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
        });

        const menuSection = mountWithServerContext(
            <ProductMenuSection
                config={config}
                containerPath="/test/path"
                currentProductId="testProduct"
                section={section}
            />,
            getDefaultServerContext()
        );

        expect(menuSection.find('li.empty-section').length).toBe(1);
        expect(menuSection.contains('Test empty text')).toBe(true);
        expect(menuSection.contains('Empty due to exclusion')).toBe(false);

        expect(menuSection.find('.menu-section-header').length).toBe(1);
        expect(menuSection.find('.menu-section-header').childAt(0).prop('href')).toBe('#/samples');

        expect(menuSection).toMatchSnapshot();
    });

    test('not empty, but all items hidden', () => {
        const config = new MenuSectionConfig({
            emptyText: 'Test empty text',
            filteredEmptyText: 'Empty due to exclusion',
            emptyURL: AppURL.create('sample', 'new'),
            emptyURLText: 'Test empty link',
            iconURL: '/testProduct/images/samples.svg',
        });
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: sampleSetItemsAllHidden,
            key: 'samples',
        });

        const menuSection = mountWithServerContext(
            <ProductMenuSection
                config={config}
                containerPath="/test/path"
                currentProductId="testProduct"
                section={section}
            />,
            getDefaultServerContext()
        );

        expect(menuSection.find('li.empty-section').length).toBe(1);
        expect(menuSection.contains('Test empty text')).toBe(false);
        expect(menuSection.contains('Empty due to exclusion')).toBe(true);

        expect(menuSection.find('.menu-section-header').length).toBe(1);
        expect(menuSection.find('.menu-section-header').childAt(0).prop('href')).toBe('#/samples');

        expect(menuSection).toMatchSnapshot();
    });

    test('some items hidden', () => {
        const config = new MenuSectionConfig({
            emptyText: 'Test empty text',
            filteredEmptyText: 'Empty due to exclusion',
            emptyURL: AppURL.create('sample', 'new'),
            emptyURLText: 'Test empty link',
            iconURL: '/testProduct/images/samples.svg',
        });
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: sampleSetItemsSomeHidden,
            key: 'samples',
        });

        const menuSection = mountWithServerContext(
            <ProductMenuSection
                config={config}
                containerPath="/test/path"
                currentProductId="testProduct"
                section={section}
            />,
            getDefaultServerContext()
        );

        expect(menuSection.find('li.empty-section').length).toBe(0);
        expect(menuSection.contains('Test empty text')).toBe(false);
        expect(menuSection.contains('Empty due to exclusion')).toBe(false);
        expect(menuSection.find('li').length).toBe(3);
        menuSection.unmount();
    });

    test('section with custom headerURL and headerText', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
        });

        const menuSection = mountWithServerContext(
            <ProductMenuSection
                containerPath="/test/path"
                currentProductId="testProductHeaderUrl"
                section={section}
                config={
                    new MenuSectionConfig({
                        iconURL: '/testProduct/images/samples.svg',
                        headerURLPart: AppURL.create('sample', 'new').addParams({ sort: 'date' }),
                        headerText: 'Custom Sample Sets',
                    })
                }
            />,
            getDefaultServerContext()
        );

        expect(menuSection.find('.menu-section-header').length).toBe(1);
        expect(menuSection.find('.menu-section-header').childAt(0).prop('href')).toBe('#%2Fsample%2Fnew%3Fsort%3Ddate');

        expect(menuSection).toMatchSnapshot();
    });

    test('one-column section', () => {
        const productId = 'testProduct3Columns';

        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            url: undefined,
            items: sampleSetItems,
            key: 'samples',
        });

        const menuSection = mountWithServerContext(
            <ProductMenuSection
                containerPath="/test/path"
                currentProductId={productId}
                section={section}
                config={
                    new MenuSectionConfig({
                        iconURL: '/testProduct3Columns/images/samples.svg',
                    })
                }
            />,
            getDefaultServerContext()
        );
        expect(menuSection.find('ul').length).toBe(1);
        expect(menuSection.find('i.fa-spinner').length).toBe(1); // verify active job indicator
        expect(menuSection).toMatchSnapshot();
        menuSection.unmount();
    });

    test('one column section', () => {
        const productId = 'testProduct4Columns';

        const section = MenuSectionModel.create({
            label: 'Assays',
            items: assayItems,
            key: 'assays',
        });

        const sectionConfig = new MenuSectionConfig({
            iconURL: '/testProduct4Columns/images/assays.svg',
        });

        const menuSection = mountWithServerContext(
            <ProductMenuSection
                section={section}
                containerPath="/test/path"
                currentProductId={productId}
                config={sectionConfig}
            />,
            getDefaultServerContext()
        );

        expect(menuSection.find('ul').length).toBe(1);
        expect(menuSection.find('i.fa-spinner').length).toBe(0); // no active jobs present
        expect(menuSection).toMatchSnapshot();
        menuSection.unmount();
    });

    test('do not show active job', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
        });

        const menuSection = mountWithServerContext(
            <ProductMenuSection
                containerPath="/test/path"
                currentProductId="testProductHeaderUrl"
                section={section}
                config={
                    new MenuSectionConfig({
                        showActiveJobIcon: false,
                    })
                }
            />,
            getDefaultServerContext()
        );

        expect(menuSection.find('i.fa-spinner').length).toBe(0);
    });

    test('use custom active job cls', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
        });

        const menuSection = mountWithServerContext(
            <ProductMenuSection
                containerPath="/test/path"
                currentProductId="testProductHeaderUrl"
                section={section}
                config={
                    new MenuSectionConfig({
                        activeJobIconCls: 'job-running-icon',
                    })
                }
            />,
            getDefaultServerContext()
        );

        expect(menuSection.find('i.fa-spinner').length).toBe(0);
        expect(menuSection.find('i.job-running-icon').length).toBe(0);
    });

    test('home project', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
        });

        const menuSection = mountWithServerContext(
            <ProductMenuSection
                containerPath="/test"
                currentProductId="testProductHeaderUrl"
                section={section}
                config={
                    new MenuSectionConfig({
                        emptyText: 'Testing empty',
                        emptyAppURL: 'home',
                        emptyURLText: 'Create it',
                    })
                }
            />,
            getDefaultServerContext()
        );

        expect(menuSection.find('.empty-section').text()).toBe('Testing empty');
        expect(menuSection.find('.empty-section-link').length).toBe(1);
        expect(menuSection.find('.empty-section-link').text()).toBe('Create it');
        expect(menuSection.find('.empty-section-link').childAt(0).prop('href')).toBe('home');
    });

    test('useOriginalURL', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
            url: 'www.labkey.org',
        });

        const menuSection = mountWithServerContext(
            <ProductMenuSection
                containerPath="/test/sub"
                currentProductId="testProductHeaderUrl"
                section={section}
                config={
                    new MenuSectionConfig({
                        useOriginalURL: true,
                    })
                }
            />,
            getDefaultServerContext()
        );

        expect(menuSection.find('.menu-section-header').length).toBe(1);
        expect(menuSection.find('.menu-section-header').childAt(0).prop('href')).toBe('www.labkey.org');
    });
});
