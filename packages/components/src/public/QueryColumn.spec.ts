import { STORAGE_UNIQUE_ID_CONCEPT_URI } from '../internal/components/domainproperties/constants';

import { insertColumnFilter, QueryColumn } from './QueryColumn';

describe('QueryColumn: Sample Lookup', () => {
    // prepare stuff we need
    const validColumn = QueryColumn.create({
        align: 'left',
        caption: 'Special Column',
        conceptURI: null,
        defaultValue: null,
        fieldKey: 'special_column',
        fieldKeyArray: ['special_column'],
        hidden: false,
        inputType: 'text',
        isKeyField: false,
        jsonType: 'string',
        lookup: {
            displayColumn: 'Name',
            isPublic: true,
            keyColumn: 'Name',
            queryName: 'Samples',
            schemaName: 'samples',
            table: 'Samples',
        },
        multiValue: false,
        name: 'special_column',
        rangeURI: 'http://www.w3.org/2001/XMLSchema#string',
        readOnly: false,
        required: false,
        shortCaption: 'Special Column',
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
    });

    const bogusColumn = QueryColumn.create({
        align: 'left',
        caption: 'Special Column',
        conceptURI: null,
        defaultValue: null,
        fieldKey: 'special_column',
        fieldKeyArray: ['special_column'],
        hidden: false,
        inputType: 'text',
        isKeyField: false,
        jsonType: 'string',
        lookup: {
            displayColumn: 'Name',
            isPublic: true,
            keyColumn: 'Name',
            queryName: 'bogusQuery',
            schemaName: 'bogusSchema',
            table: 'WrongTable',
        },
        multiValue: false,
        name: 'special_column',
        rangeURI: 'http://www.w3.org/2001/XMLSchema#string',
        readOnly: false,
        required: false,
        shortCaption: 'Special Column',
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
    });

    const materialSamplesColumn = QueryColumn.create({
        align: 'left',
        caption: 'Special Column',
        conceptURI: null,
        defaultValue: null,
        fieldKey: 'special_column',
        fieldKeyArray: ['special_column'],
        hidden: false,
        inputType: 'text',
        isKeyField: false,
        jsonType: 'string',
        lookup: {
            displayColumn: 'Name',
            isPublic: true,
            keyColumn: 'Name',
            queryName: 'exp.Materials',
            schemaName: 'samples',
            table: 'Samples',
        },
        multiValue: false,
        name: 'special_column',
        rangeURI: 'http://www.w3.org/2001/XMLSchema#string',
        readOnly: false,
        required: false,
        shortCaption: 'Special Column',
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
    });

    const materialSamplesWithAllCapsColumn = QueryColumn.create({
        align: 'left',
        caption: 'Special Column',
        conceptURI: null,
        defaultValue: null,
        fieldKey: 'special_column',
        fieldKeyArray: ['special_column'],
        hidden: false,
        inputType: 'text',
        isKeyField: false,
        jsonType: 'string',
        lookup: {
            displayColumn: 'Name',
            isPublic: true,
            keyColumn: 'Name',
            queryName: 'EXP.MATERIALS',
            schemaName: 'SAMPLES',
            table: 'SAMPLES',
        },
        multiValue: false,
        name: 'special_column',
        rangeURI: 'http://www.w3.org/2001/XMLSchema#string',
        readOnly: false,
        required: false,
        shortCaption: 'Special Column',
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
    });

    test('lookup to samples/Samples', () => {
        expect(validColumn.isSampleLookup()).toBe(true);
    });

    test('verify invalid column (into bogus schema/table)', () => {
        expect(bogusColumn.isSampleLookup()).toBe(false);
    });

    test('lookup to exp.Materials/Samples', () => {
        expect(materialSamplesColumn.isSampleLookup()).toBe(true);
    });

    test('lookup with different casing for query, schema and table names', () => {
        expect(materialSamplesWithAllCapsColumn.isSampleLookup()).toBe(true);
    });

    test('isImportColumn', () => {
        expect(validColumn.isImportColumn(undefined)).toBeFalsy();
        expect(validColumn.isImportColumn('not a name')).toBeFalsy();
        expect(validColumn.isImportColumn('Special Column')).toBeTruthy();
        expect(validColumn.isImportColumn('special_column')).toBeTruthy();
        expect(validColumn.isImportColumn('Special_column')).toBeTruthy();
    });

    test('isDataInput', () => {
        expect(new QueryColumn({}).isDataInput()).toBeFalsy();
        expect(new QueryColumn({ name: 'test' }).isDataInput()).toBeFalsy();
        expect(new QueryColumn({ name: 'DataInputs', lookup: 'lookHere' }).isDataInput()).toBeTruthy();
    });

    test('isMaterialInput', () => {
        expect(new QueryColumn({}).isMaterialInput()).toBeFalsy();
        expect(new QueryColumn({ name: 'test' }).isMaterialInput()).toBeFalsy();
        expect(new QueryColumn({ name: 'MaterialInputs', lookup: 'lookHere' }).isMaterialInput()).toBeTruthy();
    });

    test('isExpInput', () => {
        expect(new QueryColumn({}).isExpInput()).toBeFalsy();
        expect(new QueryColumn({ name: 'test' }).isExpInput()).toBeFalsy();
        expect(new QueryColumn({ name: 'DataInputs', lookup: 'lookHere' }).isExpInput()).toBeTruthy();
        expect(new QueryColumn({ name: 'MaterialInputs', lookup: 'lookHere' }).isExpInput()).toBeTruthy();
    });

    test('isEditable', () => {
        expect(new QueryColumn({}).isEditable()).toBeFalsy();
        expect(
            new QueryColumn({ readOnly: true, userEditable: true, shownInUpdateView: true }).isEditable()
        ).toBeFalsy();
        expect(
            new QueryColumn({ readOnly: true, userEditable: true, shownInUpdateView: false }).isEditable()
        ).toBeFalsy();
        expect(
            new QueryColumn({ readOnly: true, userEditable: false, shownInUpdateView: true }).isEditable()
        ).toBeFalsy();
        expect(
            new QueryColumn({ readOnly: true, userEditable: false, shownInUpdateView: false }).isEditable()
        ).toBeFalsy();
        expect(
            new QueryColumn({ readOnly: false, userEditable: true, shownInUpdateView: true }).isEditable()
        ).toBeTruthy();
        expect(
            new QueryColumn({ readOnly: false, userEditable: false, shownInUpdateView: true }).isEditable()
        ).toBeFalsy();
        expect(
            new QueryColumn({ readOnly: false, userEditable: true, shownInUpdateView: false }).isEditable()
        ).toBeFalsy();
        expect(
            new QueryColumn({ readOnly: false, userEditable: false, shownInUpdateView: false }).isEditable()
        ).toBeFalsy();
    });

    test('isLookup', () => {
        expect(new QueryColumn({}).isLookup()).toBeFalsy();
        expect(new QueryColumn({ lookup: {} }).isLookup()).toBeTruthy();
    });

    test('isPublicLookup', () => {
        expect(new QueryColumn({}).isPublicLookup()).toBeFalsy();
        expect(new QueryColumn({ lookup: {} }).isPublicLookup()).toBeFalsy();
        expect(new QueryColumn({ lookup: { isPublic: false } }).isPublicLookup()).toBeFalsy();
        expect(new QueryColumn({ lookup: { isPublic: true } }).isPublicLookup()).toBeTruthy();
    });

    test('isJunctionLookup', () => {
        expect(new QueryColumn({}).isJunctionLookup()).toBeFalsy();
        expect(new QueryColumn({ lookup: { multiValued: undefined } }).isJunctionLookup()).toBeFalsy();
        expect(new QueryColumn({ lookup: { multiValued: 'test' } }).isJunctionLookup()).toBeFalsy();
        expect(new QueryColumn({ lookup: { multiValued: 'junction' } }).isJunctionLookup()).toBeTruthy();
    });

    test('isDetailColumn', () => {
        expect(new QueryColumn({}).isDetailColumn).toBeFalsy();
        expect(new QueryColumn({ removeFromViews: true, shownInDetailsView: true }).isDetailColumn).toBeFalsy();
        expect(new QueryColumn({ removeFromViews: true, shownInDetailsView: false }).isDetailColumn).toBeFalsy();
        expect(new QueryColumn({ removeFromViews: false, shownInDetailsView: true }).isDetailColumn).toBeTruthy();
        expect(new QueryColumn({ removeFromViews: false, shownInDetailsView: false }).isDetailColumn).toBeFalsy();
    });

    test('isUpdateColumn', () => {
        expect(new QueryColumn({}).isUpdateColumn).toBeFalsy();
        expect(
            new QueryColumn({
                removeFromViews: true,
                shownInUpdateView: true,
                userEditable: true,
                fieldKeyArray: ['test'],
            }).isUpdateColumn
        ).toBeFalsy();
        expect(
            new QueryColumn({
                removeFromViews: true,
                shownInUpdateView: true,
                userEditable: false,
                fieldKeyArray: ['test'],
            }).isUpdateColumn
        ).toBeFalsy();
        expect(
            new QueryColumn({
                removeFromViews: true,
                shownInUpdateView: false,
                userEditable: true,
                fieldKeyArray: ['test'],
            }).isUpdateColumn
        ).toBeFalsy();
        expect(
            new QueryColumn({
                removeFromViews: true,
                shownInUpdateView: false,
                userEditable: false,
                fieldKeyArray: ['test'],
            }).isUpdateColumn
        ).toBeFalsy();
        expect(
            new QueryColumn({
                removeFromViews: false,
                shownInUpdateView: true,
                userEditable: true,
                fieldKeyArray: ['test'],
            }).isUpdateColumn
        ).toBeTruthy();
        expect(
            new QueryColumn({
                removeFromViews: false,
                shownInUpdateView: true,
                userEditable: false,
                fieldKeyArray: ['test'],
            }).isUpdateColumn
        ).toBeFalsy();
        expect(
            new QueryColumn({
                removeFromViews: false,
                shownInUpdateView: false,
                userEditable: true,
                fieldKeyArray: ['test'],
            }).isUpdateColumn
        ).toBeFalsy();
        expect(
            new QueryColumn({
                removeFromViews: false,
                shownInUpdateView: false,
                userEditable: false,
                fieldKeyArray: ['test'],
            }).isUpdateColumn
        ).toBeFalsy();

        expect(
            new QueryColumn({
                removeFromViews: false,
                shownInUpdateView: true,
                userEditable: true,
                fieldKeyArray: ['test1', 'test2'],
            }).isUpdateColumn
        ).toBeFalsy();
    });

    test('isUniqueIdColumn', () => {
        expect(new QueryColumn({}).isUniqueIdColumn).toBeFalsy();
        expect(new QueryColumn({ conceptURI: 'test' }).isUniqueIdColumn).toBeFalsy();
        expect(new QueryColumn({ conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI }).isUniqueIdColumn).toBeTruthy();
    });

    test('isFileInput', () => {
        expect(new QueryColumn({}).isFileInput).toBeFalsy();
        expect(new QueryColumn({ inputType: 'test' }).isFileInput).toBeFalsy();
        expect(new QueryColumn({ inputType: 'file' }).isFileInput).toBeTruthy();
    });

    test('resolveFieldKey', () => {
        expect(new QueryColumn({}).resolveFieldKey()).toBe(undefined);
        expect(new QueryColumn({ fieldKey: 'name', name: 'name' }).resolveFieldKey()).toBe('name');
        expect(new QueryColumn({ fieldKey: 'name$Sslash', name: 'name/slash' }).resolveFieldKey()).toBe('name$Sslash');
        expect(
            new QueryColumn({
                fieldKey: 'name',
                name: 'name',
                lookup: { displayColumn: 'displayColumn' },
            }).resolveFieldKey()
        ).toBe('name/displayColumn');
        expect(
            new QueryColumn({
                fieldKey: 'name$Sslash',
                name: 'name/slash',
                lookup: { displayColumn: 'displayColumn' },
            }).resolveFieldKey()
        ).toBe('name$Sslash/displayColumn');
        expect(
            new QueryColumn({
                fieldKey: 'name',
                name: 'name',
                lookup: { displayColumn: 'displayColumn1/displayColumn2' },
            }).resolveFieldKey()
        ).toBe('name/displayColumn1$SdisplayColumn2');
        expect(
            new QueryColumn({
                fieldKey: 'name$Sslash',
                name: 'name/slash',
                lookup: { displayColumn: 'displayColumn1/displayColumn2' },
            }).resolveFieldKey()
        ).toBe('name$Sslash/displayColumn1$SdisplayColumn2');
    });
});

describe('insertColumnFilter', () => {
    test('query column props', () => {
        expect(insertColumnFilter(undefined)).toBeFalsy();
        expect(insertColumnFilter(new QueryColumn())).toBeFalsy();
        expect(
            insertColumnFilter(
                new QueryColumn({
                    removeFromViews: true,
                    shownInInsertView: true,
                    userEditable: true,
                    fieldKeyArray: ['test'],
                })
            )
        ).toBeFalsy();
        expect(
            insertColumnFilter(
                new QueryColumn({
                    removeFromViews: true,
                    shownInInsertView: true,
                    userEditable: false,
                    fieldKeyArray: ['test'],
                })
            )
        ).toBeFalsy();
        expect(
            insertColumnFilter(
                new QueryColumn({
                    removeFromViews: true,
                    shownInInsertView: false,
                    userEditable: true,
                    fieldKeyArray: ['test'],
                })
            )
        ).toBeFalsy();
        expect(
            insertColumnFilter(
                new QueryColumn({
                    removeFromViews: true,
                    shownInInsertView: false,
                    userEditable: false,
                    fieldKeyArray: ['test'],
                })
            )
        ).toBeFalsy();
        expect(
            insertColumnFilter(
                new QueryColumn({
                    removeFromViews: false,
                    shownInInsertView: true,
                    userEditable: true,
                    fieldKeyArray: ['test'],
                })
            )
        ).toBeTruthy();
        expect(
            insertColumnFilter(
                new QueryColumn({
                    removeFromViews: false,
                    shownInInsertView: true,
                    userEditable: false,
                    fieldKeyArray: ['test'],
                })
            )
        ).toBeFalsy();
        expect(
            insertColumnFilter(
                new QueryColumn({
                    removeFromViews: false,
                    shownInInsertView: false,
                    userEditable: true,
                    fieldKeyArray: ['test'],
                })
            )
        ).toBeFalsy();
        expect(
            insertColumnFilter(
                new QueryColumn({
                    removeFromViews: false,
                    shownInInsertView: false,
                    userEditable: false,
                    fieldKeyArray: ['test'],
                })
            )
        ).toBeFalsy();

        expect(
            insertColumnFilter(
                new QueryColumn({
                    removeFromViews: false,
                    shownInInsertView: true,
                    userEditable: true,
                    fieldKeyArray: ['test1', 'test2'],
                })
            )
        ).toBeFalsy();
    });
});
