import { QueryColumn } from './QueryColumn';

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

    test('test lookup to exp.Materials/Samples', () => {
        expect(materialSamplesColumn.isSampleLookup()).toBe(true);
    });

    test('test lookup with different casing for query, schema and table names', () => {
        expect(materialSamplesWithAllCapsColumn.isSampleLookup()).toBe(true);
    });
});
