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
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import { List } from 'immutable';

import { AppURL } from '../../url/AppURL';

import { MenuSectionModel } from './model';
import { MenuSectionConfig, ProductMenuSection } from './ProductMenuSection';

describe('ProductMenuSection render', () => {
    const sampleSetItems = List<MenuSectionModel>([
        {
            id: 1,
            label: 'Sample Set 1',
        },
        {
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

    const yourItemsSection = MenuSectionModel.create({
        label: 'Your Items',
        items: yourItems,
        key: 'user',
    });

    test('empty section no text', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            itemLimit: 2,
            key: 'samples',
        });

        const menuSection = mount(
            <ProductMenuSection
                currentProductId="testProduct"
                section={section}
                config={
                    new MenuSectionConfig({
                        iconURL: '/testProduct/images/samples.svg',
                    })
                }
            />
        );

        expect(menuSection.find('li').length).toBe(0);
        expect(toJson(menuSection)).toMatchSnapshot();
    });

    test('empty section with empty text and create link', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            key: 'samples',
        });
        const menuSection = mount(
            <ProductMenuSection
                currentProductId="testProduct"
                section={section}
                config={
                    new MenuSectionConfig({
                        emptyText: 'Test empty text',
                        iconURL: '/testProduct/images/samples.svg',
                        emptyURL: AppURL.create('sample', 'new'),
                        emptyURLText: 'Test empty link',
                    })
                }
            />
        );

        expect(menuSection.find('li.empty-section').length).toBe(1);
        expect(menuSection.contains('Test empty text')).toBe(true);
        expect(toJson(menuSection)).toMatchSnapshot();
    });

    test('section with custom headerURL and headerText', () => {
        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            items: List<MenuSectionModel>(),
            itemLimit: 2,
            key: 'samples',
        });

        const menuSection = mount(
            <ProductMenuSection
                currentProductId="testProductHeaderUrl"
                section={section}
                config={
                    new MenuSectionConfig({
                        iconURL: '/testProduct/images/samples.svg',
                        headerURL: AppURL.create('sample', 'new').addParams({ sort: 'date' }),
                        headerText: 'Custom Sample Sets',
                    })
                }
            />
        );

        expect(toJson(menuSection)).toMatchSnapshot();
    });

    test('one-column section', () => {
        const productId = 'testProduct3Columns';

        const section = MenuSectionModel.create({
            label: 'Sample Sets',
            url: undefined,
            items: sampleSetItems,
            itemLimit: 2,
            key: 'samples',
        });

        const menuSection = mount(
            <ProductMenuSection
                currentProductId={productId}
                section={section}
                config={
                    new MenuSectionConfig({
                        iconURL: '/testProduct3Columns/images/samples.svg',
                    })
                }
            />
        );
        expect(menuSection.find('ul').length).toBe(1);
        expect(toJson(menuSection)).toMatchSnapshot();
        menuSection.unmount();
    });

    test('two-column section', () => {
        const productId = 'testProduct4Columns';

        const section = MenuSectionModel.create({
            label: 'Assays',
            items: assayItems,
            key: 'assays',
        });

        const sectionConfig = new MenuSectionConfig({
            iconURL: '/testProduct4Columns/images/assays.svg',
            maxColumns: 2,
            maxItemsPerColumn: 2,
        });

        const menuSection = mount(
            <ProductMenuSection section={section} currentProductId={productId} config={sectionConfig} />
        );

        expect(menuSection.find('ul').length).toBe(2);
        expect(toJson(menuSection)).toMatchSnapshot();
        menuSection.unmount();
    });

    test('two columns with overflow link', () => {
        const productId = 'testProductOverflowLink';
        const sections = List<MenuSectionModel>().asMutable();

        const section = new MenuSectionModel({
            label: 'Assays',
            items: assayItems,
            key: 'assays',
            totalCount: 5,
        });

        const sectionConfig = new MenuSectionConfig({
            iconURL: '/testProductOverflowLink/images/assays.svg',
            maxColumns: 2,
            maxItemsPerColumn: 2,
        });

        const menuSection = mount(
            <ProductMenuSection section={section} currentProductId={productId} config={sectionConfig} />
        );
        expect(menuSection.find('ul').length).toBe(2);
        expect(menuSection.find('span.overflow-link').length).toBe(1);
        expect(toJson(menuSection)).toMatchSnapshot();
        menuSection.unmount();
    });
});
