import { List } from 'immutable';

import { AppURL } from '../../url/AppURL';
import { MenuItemModel, MenuSectionModel } from '../navigation/model';
import { MenuOption } from '../menus/SubMenu';

import { getMenuItemsForSection } from './utils';

const ITEM_ACTION_FN = () => {
    return AppURL.create('test');
};

const SECTION = new MenuSectionModel({
    items: List([
        new MenuItemModel({ id: 1, key: 'a', label: 'A' }),
        new MenuItemModel({ id: 2, key: 'c', label: 'C' }),
        new MenuItemModel({ id: 3, key: 'b', label: 'B' }),
    ]),
});

describe('getMenuItemsForSection', () => {
    function validate(item: MenuOption, name: string, disabledMsg = undefined, useOnClick = false): void {
        expect(item.name).toBe(name);
        expect(item.disabled).toBe(disabledMsg !== undefined);
        expect(item.disabledMsg).toBe(disabledMsg);
        if (useOnClick) {
            expect(item.href).toBeUndefined();
            expect(item.onClick).toBeDefined();
        } else {
            expect(item.href).toBeDefined();
            expect(item.onClick).toBeUndefined();
        }
    }

    test('without section', () => {
        const items = getMenuItemsForSection(undefined, false, ITEM_ACTION_FN);
        expect(items.size).toBe(0);
    });

    test('sort by label', () => {
        const items = getMenuItemsForSection(SECTION, false, ITEM_ACTION_FN);
        expect(items.size).toBe(3);
        validate(items.get(0), 'A');
        validate(items.get(1), 'B');
        validate(items.get(2), 'C');
    });

    test('disabledMsg', () => {
        const items = getMenuItemsForSection(SECTION, false, ITEM_ACTION_FN, 'Test disabled');
        validate(items.get(0), 'A', 'Test disabled');
    });

    test('useOnClick', () => {
        const items = getMenuItemsForSection(SECTION, true, ITEM_ACTION_FN);
        validate(items.get(0), 'A', undefined, true);
    });
});
