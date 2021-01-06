import {DomainDesign, DomainField} from "./models";
import {generateBulkDeleteWarning, getVisibleFieldCount, getVisibleSelectedFieldIndexes} from "./propertiesUtil";
import {List} from "immutable";

describe('domain properties utils', () => {
    test('generateBulkDeleteWarning', () => {
        const deletabilityInfo = {deletableSelectedFields: [1, 2, 3], undeletableFields: [0]};
        const undeletableNames = ["KeyFieldName"];
        const result = {howManyDeleted: "3 of 4 fields", undeletableWarning: "KeyFieldName cannot be deleted as it is a necessary field."};
        expect(generateBulkDeleteWarning(deletabilityInfo, undeletableNames)).toEqual(result);

        const deletabilityInfoNoKey = {deletableSelectedFields: [1, 2], undeletableFields: []};
        const resultNoKey = {howManyDeleted: "2 fields", undeletableWarning: ""};
        expect(generateBulkDeleteWarning(deletabilityInfoNoKey, [])).toEqual(resultNoKey);

        const deletabilityInfoSingluar = {deletableSelectedFields: [1], undeletableFields: []};
        const resultSingluar = {howManyDeleted: "1 field", undeletableWarning: ""};
        expect(generateBulkDeleteWarning(deletabilityInfoSingluar, [])).toEqual(resultSingluar);
    });

    test('getVisibleSelectedFieldIndexes', () => {
        const invisibleSelected = DomainField.create({visible: false, selected: true});
        const visibleSelected = DomainField.create({visible: true, selected: true});
        const visibleNonselected = DomainField.create({visible: true, selected: false});

        const fieldList = List.of(invisibleSelected, visibleNonselected, visibleSelected, visibleSelected);
        const set = new Set();
        set.add(2);
        set.add(3);

        expect(getVisibleSelectedFieldIndexes(fieldList)).toEqual(set);
    });

    test('getVisibleFieldCount', () => {
        const fields = [];
        fields.push({visible: false});
        fields.push({visible: false});
        fields.push({visible: true});
        fields.push({visible: true});
        fields.push({visible: true});
        const domain = DomainDesign.create({fields});

        expect(getVisibleFieldCount(domain)).toEqual(3);
    });
});
