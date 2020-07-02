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
import { fromJS, List, OrderedMap } from 'immutable';

import assayDefJSON from '../../../test/data/assayDefinitionModel.json';
import assayDefNoSampleIdJSON from '../../../test/data/assayDefinitionModelNoSampleId.json';
import sampleSetQueryInfo from '../../../test/data/sampleSet-getQueryDetails.json';
import nameExpSetQueryColumn from '../../../test/data/NameExprParent-QueryColumn.json';
import sampleSet3QueryColumn from '../../../test/data/SampleSet3Parent-QueryColumn.json';

import { TEST_USER_GUEST, TEST_USER_READER, TEST_USER_AUTHOR, TEST_USER_EDITOR, TEST_USER_ASSAY_DESIGNER, TEST_USER_FOLDER_ADMIN, TEST_USER_APP_ADMIN } from '../../../test/data/users';

import { AssayDefinitionModel, AssayDomainTypes, QueryColumn, QueryGridModel, SchemaQuery } from './model';
import { QueryInfo } from './QueryInfo';

describe('QueryGridModel', () => {
    test('createParam no prefix', () => {
        const model = new QueryGridModel();
        expect(model.createParam('param')).toEqual('param');
        expect(model.createParam('param', 'default')).toEqual('default.param');
    });

    test('createParam with prefix', () => {
        const model = new QueryGridModel({
            urlPrefix: 'test',
        });
        expect(model.createParam('param')).toEqual('test.param');
        expect(model.createParam('param', 'default')).toEqual('test.param');
    });

    describe('getSelectedData', () => {
        test('nothing selected', () => {
            const model = new QueryGridModel({
                data: fromJS({
                    '1': {
                        field1: {
                            value: 'value1',
                        },
                        field2: {
                            value: 'value2',
                        },
                    },
                    '2': {
                        field1: {
                            value: 'value3',
                        },
                        field2: {
                            value: 'value4',
                        },
                    },
                }),
            });
            expect(model.getSelectedData().size).toBe(0);
        });

        test('all selected', () => {
            const model = new QueryGridModel({
                data: fromJS({
                    '123': {
                        field1: {
                            value: 'value1',
                        },
                        field2: {
                            value: 'value2',
                        },
                    },
                    '232': {
                        field1: {
                            value: 'value3',
                        },
                        field2: {
                            value: 'value4',
                        },
                    },
                }),
                selectedIds: List(['123', '232']),
            });
            expect(model.getSelectedData()).toEqual(model.data);
        });

        test('some selected', () => {
            const model = new QueryGridModel({
                data: fromJS({
                    '123': {
                        field1: {
                            value: 'value1',
                        },
                        field2: {
                            value: 'value2',
                        },
                    },
                    '234': {
                        field1: {
                            value: 'value3',
                        },
                        field2: {
                            value: 'value4',
                        },
                    },
                    '232': {
                        field1: {
                            value: 'value3',
                        },
                        field2: {
                            value: 'value4',
                        },
                    },
                }),
                selectedIds: List(['123', '232', 'nope']),
            });
            expect(model.getSelectedData()).toEqual(
                fromJS({
                    '123': {
                        field1: {
                            value: 'value1',
                        },
                        field2: {
                            value: 'value2',
                        },
                    },
                    '232': {
                        field1: {
                            value: 'value3',
                        },
                        field2: {
                            value: 'value4',
                        },
                    },
                })
            );
        });
    });
});

describe('QueryInfo', () => {
    const FIRST_COL_KEY = 'Sample Set 3 Parents';
    const SECOND_COL_KEY = 'NameExpr Parents';

    const queryInfo = QueryInfo.fromJSON(sampleSetQueryInfo);
    let newColumns = OrderedMap<string, QueryColumn>();
    newColumns = newColumns.set(FIRST_COL_KEY, QueryColumn.create(sampleSet3QueryColumn));
    newColumns = newColumns.set(SECOND_COL_KEY, QueryColumn.create(nameExpSetQueryColumn));

    describe('insertColumns', () => {
        test('negative columnIndex', () => {
            const columns = queryInfo.insertColumns(-1, newColumns);
            expect(columns).toBe(queryInfo.columns);
        });

        test('columnIndex just too large', () => {
            const columns = queryInfo.insertColumns(queryInfo.columns.size + 1, newColumns);
            expect(columns).toBe(queryInfo.columns);
        });

        test('as first column', () => {
            const columns = queryInfo.insertColumns(0, newColumns);
            const firstColKey = queryInfo.columns.keySeq().first();
            expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(0);
            expect(columns.keySeq().indexOf(SECOND_COL_KEY)).toBe(1);
            expect(columns.keySeq().indexOf(firstColKey)).toBe(2);
            expect(columns.size).toBe(queryInfo.columns.size + newColumns.size);
        });

        test('as last column', () => {
            const columns = queryInfo.insertColumns(queryInfo.columns.size, newColumns);
            const firstColKey = queryInfo.columns.keySeq().first();
            expect(columns.size).toBe(queryInfo.columns.size + newColumns.size);
            expect(columns.keySeq().indexOf(firstColKey)).toBe(0);
            expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(queryInfo.columns.size);
            expect(columns.keySeq().indexOf(SECOND_COL_KEY)).toBe(queryInfo.columns.size + 1);
        });

        test('in middle', () => {
            const nameIndex = queryInfo.columns.keySeq().findIndex(key => key.toLowerCase() === 'name');
            const columns = queryInfo.insertColumns(nameIndex + 1, newColumns);
            expect(columns.size).toBe(queryInfo.columns.size + newColumns.size);
            expect(columns.keySeq().get(nameIndex).toLowerCase()).toBe('name');
            expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(nameIndex + 1);
            expect(columns.keySeq().indexOf(SECOND_COL_KEY)).toBe(nameIndex + 2);
        });

        test('single column', () => {
            const nameIndex = queryInfo.columns.keySeq().findIndex(key => key.toLowerCase() === 'name');
            const columns = queryInfo.insertColumns(
                nameIndex + 1,
                newColumns
                    .filter(queryColumn => queryColumn.caption.toLowerCase() === FIRST_COL_KEY.toLowerCase())
                    .toOrderedMap()
            );
            expect(columns.size).toBe(queryInfo.columns.size + 1);
            expect(columns.keySeq().get(nameIndex).toLowerCase()).toBe('name');
            expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(nameIndex + 1);
        });
    });

    describe('getUpdateColumns', () => {
        test('without readOnly columns', () => {
            const columns = queryInfo.getUpdateColumns();
            expect(columns.size).toBe(3);
            expect(columns.get(0).fieldKey).toBe('Description');
            expect(columns.get(1).fieldKey).toBe('SampleSet');
            expect(columns.get(2).fieldKey).toBe('New');
        });

        test('with readOnly columns', () => {
            const columns = queryInfo.getUpdateColumns(
                List<string>(['Name'])
            );
            expect(columns.size).toBe(4);
            expect(columns.get(0).fieldKey).toBe('Name');
            expect(columns.get(1).fieldKey).toBe('Description');
            expect(columns.get(2).fieldKey).toBe('SampleSet');
            expect(columns.get(3).fieldKey).toBe('New');
        });
    });

    describe('getIconURL', () => {
        test('default', () => {
            const queryInfo = QueryInfo.create({ schemaName: 'test', name: 'test' });
            expect(queryInfo.getIconURL()).toBe('default');
        });

        test('with custom iconURL', () => {
            const queryInfo = QueryInfo.create({ schemaName: 'samples', name: 'test', iconURL: 'other' });
            expect(queryInfo.getIconURL()).toBe('other');
        });
    });
});

describe('AssayDefinitionModel', () => {
    test('with getSampleColumn()', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const sampleColumn = modelWithSampleId.getSampleColumn();
        expect(sampleColumn).toBeTruthy();
        expect(sampleColumn.domain).toBe('Result');
        expect(sampleColumn.column.isLookup()).toBeTruthy();
        expect(sampleColumn.column.fieldKey).toBe('SampleID');
    });

    test('without getSampleColumn()', () => {
        const modelWithout = AssayDefinitionModel.create(assayDefNoSampleIdJSON);
        const nonSampleColumn = modelWithout.getSampleColumn();
        expect(nonSampleColumn).toBe(null);
    });

    test('with getSampleColumn()', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const sampleColumn = modelWithSampleId.getSampleColumn();
        expect(sampleColumn.column.name).toBe('SampleID');
    });

    test('without getSampleColumn()', () => {
        const modelWithout = AssayDefinitionModel.create(assayDefNoSampleIdJSON);
        const nonSampleColumn = modelWithout.getSampleColumn();
        expect(nonSampleColumn).toBe(null);
    });

    test('hasLookup()', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        expect(modelWithSampleId.hasLookup(SchemaQuery.create('samples', 'Samples'))).toBeTruthy();
        expect(modelWithSampleId.hasLookup(SchemaQuery.create('study', 'Study'))).toBeTruthy();
        expect(modelWithSampleId.hasLookup(SchemaQuery.create('study', 'Other'))).toBeFalsy();
    });

    test('getSampleColumnFieldKeys()', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const fieldKeys = modelWithSampleId.getSampleColumnFieldKeys();
        expect(fieldKeys.size).toBe(1);
        expect(fieldKeys.get(0)).toBe('SampleID');
    });

    test('getDomainColumns()', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const batchColumns = modelWithSampleId.getDomainColumns(AssayDomainTypes.BATCH);
        expect(batchColumns.size).toBe(2);
        expect(batchColumns.has('ParticipantVisitResolver')).toBeFalsy();
        expect(batchColumns.has('participantvisitresolver')).toBeTruthy();
        expect(batchColumns.has('targetstudy')).toBeTruthy();

        const runColumns = modelWithSampleId.getDomainColumns(AssayDomainTypes.RUN);
        expect(runColumns.size).toBe(0);

        const dataColumns = modelWithSampleId.getDomainColumns(AssayDomainTypes.RESULT);
        expect(dataColumns.size).toBe(4);
        expect(dataColumns.has('Date')).toBeFalsy();
        expect(dataColumns.has('date')).toBeTruthy();
    });
});

describe('Sample Lookup', () => {
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

describe('User permissions', () => {
    test('hasInsertPermission', () => {
        expect(TEST_USER_GUEST.hasInsertPermission()).toBeFalsy();
        expect(TEST_USER_READER.hasInsertPermission()).toBeFalsy();
        expect(TEST_USER_AUTHOR.hasInsertPermission()).toBeTruthy();
        expect(TEST_USER_EDITOR.hasInsertPermission()).toBeTruthy();
        expect(TEST_USER_ASSAY_DESIGNER.hasInsertPermission()).toBeFalsy();
        expect(TEST_USER_FOLDER_ADMIN.hasInsertPermission()).toBeTruthy();
        expect(TEST_USER_APP_ADMIN.hasInsertPermission()).toBeTruthy();
    });

    test('hasUpdatePermission', () => {
        expect(TEST_USER_GUEST.hasUpdatePermission()).toBeFalsy();
        expect(TEST_USER_READER.hasUpdatePermission()).toBeFalsy();
        expect(TEST_USER_AUTHOR.hasUpdatePermission()).toBeFalsy();
        expect(TEST_USER_EDITOR.hasUpdatePermission()).toBeTruthy();
        expect(TEST_USER_ASSAY_DESIGNER.hasUpdatePermission()).toBeFalsy();
        expect(TEST_USER_FOLDER_ADMIN.hasUpdatePermission()).toBeTruthy();
        expect(TEST_USER_APP_ADMIN.hasUpdatePermission()).toBeTruthy();
    });

    test('hasDeletePermission', () => {
        expect(TEST_USER_GUEST.hasDeletePermission()).toBeFalsy();
        expect(TEST_USER_READER.hasDeletePermission()).toBeFalsy();
        expect(TEST_USER_AUTHOR.hasDeletePermission()).toBeFalsy();
        expect(TEST_USER_EDITOR.hasDeletePermission()).toBeTruthy();
        expect(TEST_USER_ASSAY_DESIGNER.hasDeletePermission()).toBeFalsy();
        expect(TEST_USER_FOLDER_ADMIN.hasDeletePermission()).toBeTruthy();
        expect(TEST_USER_APP_ADMIN.hasDeletePermission()).toBeTruthy();
    });

    test('hasDesignAssaysPermission', () => {
        expect(TEST_USER_GUEST.hasDesignAssaysPermission()).toBeFalsy();
        expect(TEST_USER_READER.hasDesignAssaysPermission()).toBeFalsy();
        expect(TEST_USER_AUTHOR.hasDesignAssaysPermission()).toBeFalsy();
        expect(TEST_USER_EDITOR.hasDesignAssaysPermission()).toBeFalsy();
        expect(TEST_USER_ASSAY_DESIGNER.hasDesignAssaysPermission()).toBeTruthy();
        expect(TEST_USER_FOLDER_ADMIN.hasDesignAssaysPermission()).toBeTruthy();
        expect(TEST_USER_APP_ADMIN.hasDesignAssaysPermission()).toBeTruthy();
    });

    test('hasDesignSampleSetsPermission', () => {
        expect(TEST_USER_GUEST.hasDesignSampleSetsPermission()).toBeFalsy();
        expect(TEST_USER_READER.hasDesignSampleSetsPermission()).toBeFalsy();
        expect(TEST_USER_AUTHOR.hasDesignSampleSetsPermission()).toBeFalsy();
        expect(TEST_USER_EDITOR.hasDesignSampleSetsPermission()).toBeFalsy();
        expect(TEST_USER_ASSAY_DESIGNER.hasDesignSampleSetsPermission()).toBeFalsy();
        expect(TEST_USER_FOLDER_ADMIN.hasDesignSampleSetsPermission()).toBeTruthy();
        expect(TEST_USER_APP_ADMIN.hasDesignSampleSetsPermission()).toBeTruthy();
    });

    test('hasManageUsersPermission', () => {
        expect(TEST_USER_GUEST.hasManageUsersPermission()).toBeFalsy();
        expect(TEST_USER_READER.hasManageUsersPermission()).toBeFalsy();
        expect(TEST_USER_AUTHOR.hasManageUsersPermission()).toBeFalsy();
        expect(TEST_USER_EDITOR.hasManageUsersPermission()).toBeFalsy();
        expect(TEST_USER_ASSAY_DESIGNER.hasManageUsersPermission()).toBeFalsy();
        expect(TEST_USER_FOLDER_ADMIN.hasManageUsersPermission()).toBeFalsy();
        expect(TEST_USER_APP_ADMIN.hasManageUsersPermission()).toBeTruthy();
    });

    test('isAppAdmin', () => {
        expect(TEST_USER_GUEST.isAppAdmin()).toBeFalsy();
        expect(TEST_USER_READER.isAppAdmin()).toBeFalsy();
        expect(TEST_USER_AUTHOR.isAppAdmin()).toBeFalsy();
        expect(TEST_USER_EDITOR.isAppAdmin()).toBeFalsy();
        expect(TEST_USER_ASSAY_DESIGNER.isAppAdmin()).toBeFalsy();
        expect(TEST_USER_FOLDER_ADMIN.isAppAdmin()).toBeFalsy();
        expect(TEST_USER_APP_ADMIN.isAppAdmin()).toBeTruthy();
    });
});
