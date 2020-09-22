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
import { List } from 'immutable';

import { MenuItemModel, MenuSectionModel, ProductMenuModel } from './model';

describe('ProductMenuModel', () => {
    const testSectionKey = 'test';
    const testSection = MenuSectionModel.create({
        key: testSectionKey,
        label: 'My Items',
        totalCount: 2,
        items: [
            {
                key: 'a',
                label: 'A',
            },
            {
                key: 'b',
                label: 'B',
            },
        ],
    });

    const emptySectionKey = 'empty';
    const emptySection = MenuSectionModel.create({
        key: emptySectionKey,
        label: 'No Items',
        totalCount: 0,
        items: [],
    });

    test('hasSectionItems not loaded', () => {
        const model = new ProductMenuModel({ productIds: ['hasSectionItems'] });
        expect(model.hasSectionItems(testSectionKey)).toBeFalsy();
        expect(model.hasSectionItems(emptySectionKey)).toBeFalsy();
    });

    test('hasSectionItems key match', () => {
        let model = new ProductMenuModel({ productIds: ['hasSectionItems'] });
        model = model.setLoadedSections(
            List<MenuSectionModel>([testSection, emptySection])
        );
        expect(model.hasSectionItems(testSectionKey)).toBeTruthy();
        expect(model.hasSectionItems(testSectionKey + 'BOGUS')).toBeFalsy();
    });

    test('hasSectionItems empty section', () => {
        let model = new ProductMenuModel({ productIds: ['hasSectionItems'] });
        model = model.setLoadedSections(
            List<MenuSectionModel>([testSection, emptySection])
        );
        expect(model.hasSectionItems(emptySectionKey)).toBeFalsy();
    });
});

describe('MenuItemModel', () => {
    test('currentProductId param match', () => {
        const model = MenuItemModel.create(
            {
                productId: 'product1',
                url: '#/menuItem',
            },
            'sectionKey',
            'product1'
        );

        expect(model.url).toBe('#/menuItem');
    });

    test('currentProductId param mismatch', () => {
        const model = MenuItemModel.create(
            {
                productId: 'product2',
                url: '#/menuItem',
            },
            'sectionKey',
            'product1'
        );

        expect(model.url).toBe('/labkey/product2/app.view#/menuItem');
    });
});
