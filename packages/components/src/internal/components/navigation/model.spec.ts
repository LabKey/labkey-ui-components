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
        sectionKey: testSectionKey,
    });

    const emptySectionKey = 'empty';
    const emptySection = MenuSectionModel.create({
        key: emptySectionKey,
        label: 'No Items',
        totalCount: 0,
        items: [],
        sectionKey: emptySectionKey,
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

    //Check that $ in item keys are correctly escaped. see Issue #45944
    function verifyModelKey(rawKey: string, expectedKey: string) {
        const model = MenuItemModel.create(
            {
                productId: 'product2',
                key: rawKey,
                url: '#/menuItem',
            },
            'sectionKey',
            'product1'
        );
        expect(model.key).toBe(expectedKey);
    }

    test('$ in key escaped correctly', () => {
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement
        verifyModelKey("key $$", "key $$");
        verifyModelKey("key $&", "key $&");
        verifyModelKey("key $`", "key $`");
        verifyModelKey("key $'", "key $'");
        verifyModelKey("key $200", "key $200");
        verifyModelKey("key $widget", "key $widget");
    });

    test('key decoded correctly', () => {
        // keys come from server encoded using api-js QueryKey ensure that any special characters are decoded as expected
        verifyModelKey("key $C", 'key ,');
        verifyModelKey("key $T", 'key ~');
        verifyModelKey("key $B", 'key }');
        verifyModelKey("key $A", 'key &');
        verifyModelKey("key $S", 'key /');
        verifyModelKey("key $D", 'key $');
    });
});
