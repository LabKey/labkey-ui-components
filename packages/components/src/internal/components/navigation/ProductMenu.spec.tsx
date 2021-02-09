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
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';
import { List, Map } from 'immutable';

import { ProductMenu } from './ProductMenu';
import { MenuSectionModel, ProductMenuModel } from './model';
import { MenuSectionConfig } from './ProductMenuSection';

describe('ProductMenu render', () => {
    const sampleSetItems = List<MenuSectionModel>([
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

    const yourItemsSection = MenuSectionModel.create({
        label: 'Your Items',
        items: yourItems,
        key: 'user',
    });

    test('loading', () => {
        const model = new ProductMenuModel({
            productIds: ['testProduct'],
        });
        const tree = renderer.create(<ProductMenu model={model} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('error display', () => {
        const model = new ProductMenuModel({
            productIds: ['testProduct'],
            isLoaded: true,
            isLoading: false,
            isError: true,
            message: 'Test error message',
        });

        const tree = renderer.create(<ProductMenu model={model} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('no sections', () => {
        const productIds = ['testNoSections'];

        const model = new ProductMenuModel({
            productIds,
            isLoaded: true,
            isLoading: false,
            sections: List<MenuSectionModel>(),
        });
        const menuButton = mount(<ProductMenu model={model} />);
        expect(menuButton.find('.menu-section').length).toBe(0);
        menuButton.unmount();
    });

    test('multiple sections no sectionConfigs', () => {
        const productIds = ['testProduct3Columns'];

        const sections = List<MenuSectionModel>().asMutable();
        sections.push(
            MenuSectionModel.create({
                label: 'Sample Sets',
                url: undefined,
                items: sampleSetItems,
                itemLimit: 2,
                key: 'samples',
            })
        );
        sections.push(
            MenuSectionModel.create({
                label: 'Assays',
                items: assayItems,
                key: 'assays',
            })
        );
        sections.push(yourItemsSection);
        const model = new ProductMenuModel({
            productIds,
            isLoaded: true,
            isLoading: false,
            sections: sections.asImmutable(),
        });

        const menuButton = mount(<ProductMenu model={model} />);
        expect(menuButton.find('.menu-section').length).toBe(3);
        expect(menuButton.find('i.fa-spinner').length).toBe(2);
        expect(menuButton).toMatchSnapshot();
        menuButton.unmount();
    });

    test('multiple sections with sectionConfigs', () => {
        const productIds = ['testProduct2Columns'];

        const sections = List<MenuSectionModel>().asMutable();
        sections.push(
            MenuSectionModel.create({
                label: 'Sample Sets',
                url: undefined,
                items: sampleSetItems,
                itemLimit: 2,
                key: 'samples',
            })
        );
        sections.push(
            MenuSectionModel.create({
                label: 'Assays',
                items: assayItems,
                key: 'assays',
            })
        );
        sections.push(yourItemsSection);
        const model = new ProductMenuModel({
            productIds,
            isLoaded: true,
            isLoading: false,
            sections: sections.asImmutable(),
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
            })
        );
        twoSectionConfig.set(
            'user',
            new MenuSectionConfig({
                iconCls: 'test-icon-cls',
            })
        );
        sectionConfigs = sectionConfigs.push(twoSectionConfig);

        const menuButton = mount(<ProductMenu model={model} sectionConfigs={sectionConfigs} />);
        expect(menuButton.find('.menu-section').length).toBe(2);
        expect(menuButton.find('i.fa-spinner').length).toBe(1);
        expect(menuButton).toMatchSnapshot();
        menuButton.unmount();
    });
});
