import { List } from 'immutable';

import { DomainDesign, DomainField } from './models';
import {
    compareStringsAlphabetically,
    generateBulkDeleteWarning,
    getVisibleFieldCount,
    getVisibleSelectedFieldIndexes,
    removeFalseyObjKeys,
    reorderSummaryColumns
} from './propertiesUtil';

describe('domain properties utils', () => {
    test('generateBulkDeleteWarning', () => {
        const deletabilityInfo = { deletableSelectedFields: [1, 2, 3], undeletableFields: [0] };
        const undeletableNames = ['KeyFieldName'];
        const result = {
            howManyDeleted: '3 of 4 fields',
            undeletableWarning: 'KeyFieldName cannot be deleted as it is a necessary field.',
        };
        expect(generateBulkDeleteWarning(deletabilityInfo, undeletableNames)).toEqual(result);

        const deletabilityInfoNoKey = { deletableSelectedFields: [1, 2], undeletableFields: [] };
        const resultNoKey = { howManyDeleted: '2 fields', undeletableWarning: '' };
        expect(generateBulkDeleteWarning(deletabilityInfoNoKey, [])).toEqual(resultNoKey);

        const deletabilityInfoSingluar = { deletableSelectedFields: [1], undeletableFields: [] };
        const resultSingluar = { howManyDeleted: '1 field', undeletableWarning: '' };
        expect(generateBulkDeleteWarning(deletabilityInfoSingluar, [])).toEqual(resultSingluar);
    });

    test('getVisibleSelectedFieldIndexes', () => {
        const invisibleSelected = DomainField.create({ visible: false, selected: true });
        const visibleSelected = DomainField.create({ visible: true, selected: true });
        const visibleNonselected = DomainField.create({ visible: true, selected: false });

        const fieldList = List.of(invisibleSelected, visibleNonselected, visibleSelected, visibleSelected);
        const set = new Set();
        set.add(2);
        set.add(3);

        expect(getVisibleSelectedFieldIndexes(fieldList)).toEqual(set);
    });

    test('getVisibleFieldCount', () => {
        const fields = [];
        fields.push({ visible: false });
        fields.push({ visible: false });
        fields.push({ visible: true });
        fields.push({ visible: true });
        fields.push({ visible: true });
        const domain = DomainDesign.create({ fields });

        expect(getVisibleFieldCount(domain)).toEqual(3);
    });

    test('compareStringsAlphabetically', () => {
        expect(compareStringsAlphabetically('A', 'z', '+')).toEqual(-1);
        expect(compareStringsAlphabetically('a', 'z', '-')).toEqual(1);

        expect(compareStringsAlphabetically('Z', 'a', '+')).toEqual(1);
        expect(compareStringsAlphabetically('z', 'A', '-')).toEqual(-1);

        expect(compareStringsAlphabetically('B', 'b', '-')).toEqual(0);
    });

    test('removeFalseyObjKeys', () => {
        const objBefore = {
            falsey1: false, falsey2: 0, falsey3: '', falsey4: null, falsey5: undefined, falsey6: NaN,
            truthy1: true, truthy2: 1, truthy3: 'string'
        }
        const objAfter = {
            truthy1: true, truthy2: 1, truthy3: 'string'
        }
        expect(removeFalseyObjKeys(objBefore)).toStrictEqual(objAfter);

    });

    test('reorderSummaryColumns', () => {
        // name comes before propertyURI
        const summaryGrid1 = {index: 'name', caption:'', sortable: true}
        const summaryGrid2 = {index: 'propertyURI', caption:'', sortable: true}
        expect(reorderSummaryColumns(summaryGrid1, summaryGrid2)).toEqual(-1);

        // defaultValueType comes after format
        const summaryGrid3 = {index: 'defaultValueType', caption:'', sortable: true}
        const summaryGrid4 = {index: 'format', caption:'', sortable: true}
        expect(reorderSummaryColumns(summaryGrid3, summaryGrid4)).toEqual(1);
    });
});
