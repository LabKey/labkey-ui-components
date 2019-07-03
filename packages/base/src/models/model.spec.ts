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
import { fromJS, List, OrderedMap } from 'immutable'
import { AssayDefinitionModel, QueryColumn, QueryGridModel, QueryInfo, SchemaQuery } from './model'

import assayDefJSON from '../test/data/assayDefinitionModel.json';
import assayDefNoSampleIdJSON from '../test/data/assayDefinitionModelNoSampleId.json';
import sampleSetQueryInfo from "../test/data/sampleSet-getQueryDetails.json";
import nameExpSetQueryColumn from "../test/data/NameExprParent-QueryColumn.json";
import sampleSet3QueryColumn from "../test/data/SampleSet3Parent-QueryColumn.json";

describe("QueryGridModel", () => {

   test("createParam no prefix", () => {
        const model = new QueryGridModel();
        expect(model.createParam("param")).toEqual("param");
        expect(model.createParam("param", "default")).toEqual("default.param");
   });

   test("createParam with prefix", () => {
       const model = new QueryGridModel({
           urlPrefix: "test"
       });
       expect(model.createParam('param')).toEqual("test.param");
       expect(model.createParam("param", "default")).toEqual("test.param");
   });

   describe("getSelectedData", () => {
       test("nothing selected", () => {
           const model = new QueryGridModel({
               data: fromJS({
                   "1": {
                       "field1": {
                           value: "value1"
                       },
                       "field2": {
                           value: "value2"
                       }
                   },
                   "2": {
                       "field1": {
                           value: "value3"
                       },
                       "field2": {
                           value: "value4"
                       },
                   }
               }),
           });
           expect(model.getSelectedData().size).toBe(0);
       });

       test("all selected", () => {
           const model = new QueryGridModel({
               data: fromJS({
                   "123": {
                       "field1": {
                           value: "value1"
                       },
                       "field2": {
                           value: "value2"
                       }
                   },
                   "232": {
                       "field1": {
                           value: "value3"
                       },
                       "field2": {
                           value: "value4"
                       },
                   }
               }),
               selectedIds: List(["123", "232"])
           });
           expect(model.getSelectedData()).toEqual(model.data);
       });

       test("some selected", () => {
           const model = new QueryGridModel({
               data: fromJS({
                   "123": {
                       "field1": {
                           value: "value1"
                       },
                       "field2": {
                           value: "value2"
                       }
                   },
                   "234": {
                       "field1": {
                           value: "value3"
                       },
                       "field2": {
                           value: "value4"
                       },
                   },
                   "232": {
                       "field1": {
                           value: "value3"
                       },
                       "field2": {
                           value: "value4"
                       },
                   }
               }),
               selectedIds: List(["123", "232", "nope"])
           });
           expect(model.getSelectedData()).toEqual(fromJS({
               "123": {
                   "field1": {
                       value: "value1"
                   },
                   "field2": {
                       value: "value2"
                   }
               },
               "232": {
                   "field1": {
                       value: "value3"
                   },
                   "field2": {
                       value: "value4"
                   },
               }
           }));
       })
   });
});

describe("QueryInfo", () => {

    const FIRST_COL_KEY = "Sample Set 3 Parents";
    const SECOND_COL_KEY = "NameExpr Parents";

    let queryInfo = QueryInfo.fromJSON(sampleSetQueryInfo);
    let newColumns = OrderedMap<string, QueryColumn>();
    newColumns = newColumns.set(FIRST_COL_KEY, QueryColumn.create(sampleSet3QueryColumn));
    newColumns = newColumns.set(SECOND_COL_KEY, QueryColumn.create(nameExpSetQueryColumn));

    describe("insertColumns", () => {
        test("negative columnIndex", () => {
            const columns = queryInfo.insertColumns(-1, newColumns);
            expect(columns).toBe(queryInfo.columns);
        });

        test("columnIndex just too large", () => {
            const columns = queryInfo.insertColumns(queryInfo.columns.size + 1, newColumns);
            expect(columns).toBe(queryInfo.columns);
        });

        test("as first column", () => {
            const columns = queryInfo.insertColumns(0, newColumns);
            const firstColKey = queryInfo.columns.keySeq().first();
            expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(0);
            expect(columns.keySeq().indexOf(SECOND_COL_KEY)).toBe(1);
            expect(columns.keySeq().indexOf(firstColKey)).toBe(2);
            expect(columns.size).toBe(queryInfo.columns.size + newColumns.size);
        });

        test("as last column", () => {
            const columns = queryInfo.insertColumns(queryInfo.columns.size, newColumns);
            const firstColKey = queryInfo.columns.keySeq().first();
            expect(columns.size).toBe(queryInfo.columns.size + newColumns.size);
            expect(columns.keySeq().indexOf(firstColKey)).toBe(0);
            expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(queryInfo.columns.size);
            expect(columns.keySeq().indexOf(SECOND_COL_KEY)).toBe(queryInfo.columns.size + 1);
        });

        test("in middle", () => {
            const nameIndex = queryInfo.columns.keySeq().findIndex((key) => (key.toLowerCase() === 'name'));
            const columns = queryInfo.insertColumns(nameIndex + 1, newColumns);
            expect(columns.size).toBe(queryInfo.columns.size + newColumns.size);
            expect(columns.keySeq().get(nameIndex).toLowerCase()).toBe("name");
            expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(nameIndex + 1);
            expect(columns.keySeq().indexOf(SECOND_COL_KEY)).toBe(nameIndex + 2);
        });

        test("single column", () => {
            const nameIndex = queryInfo.columns.keySeq().findIndex((key) => (key.toLowerCase() === 'name'));
            const columns = queryInfo.insertColumns(nameIndex + 1, newColumns.filter((queryColumn) => (queryColumn.caption.toLowerCase() === FIRST_COL_KEY.toLowerCase())).toOrderedMap());
            expect(columns.size).toBe(queryInfo.columns.size + 1);
            expect(columns.keySeq().get(nameIndex).toLowerCase()).toBe("name");
            expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(nameIndex + 1);
        });
    });

    describe("getUpdateColumns", () => {
        test("without readOnly columns", () => {
            const columns = queryInfo.getUpdateColumns();
            expect(columns.size).toBe(3);
            expect(columns.get(0).fieldKey).toBe("Description");
            expect(columns.get(1).fieldKey).toBe("SampleSet");
            expect(columns.get(2).fieldKey).toBe("New");
        });

        test("with readOnly columns", () => {
            const columns = queryInfo.getUpdateColumns(List<string>(["Name"]));
            expect(columns.size).toBe(4);
            expect(columns.get(0).fieldKey).toBe("Name");
            expect(columns.get(1).fieldKey).toBe("Description");
            expect(columns.get(2).fieldKey).toBe("SampleSet");
            expect(columns.get(3).fieldKey).toBe("New");
        });
    });
});

describe("AssayDefinitionModel", () => {

   test("with getSampleColumn()", () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const sampleColumn = modelWithSampleId.getSampleColumn();
        expect(sampleColumn).toBeTruthy();
        expect(sampleColumn.domain).toBe('Result');
        expect(sampleColumn.column.isLookup()).toBeTruthy();
        expect(sampleColumn.column.fieldKey).toBe('SampleID');
   });

   test("without getSampleColumn()", () => {
        const modelWithout = AssayDefinitionModel.create(assayDefNoSampleIdJSON);
        const nonSampleColumn = modelWithout.getSampleColumn();
        expect(nonSampleColumn).toBe(null);
   });

   test("with getSampleColumnLookup()", () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const sampleColumn = modelWithSampleId.getSampleColumnLookup();
        expect(sampleColumn).toBe('SampleID');
   });

   test("without getSampleColumnLookup()", () => {
        const modelWithout = AssayDefinitionModel.create(assayDefNoSampleIdJSON);
        const nonSampleColumn = modelWithout.getSampleColumnLookup();
        expect(nonSampleColumn).toBe(null);
   });

   test("hasLookup()", () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        expect(modelWithSampleId.hasLookup(SchemaQuery.create('samples', 'Samples'))).toBeTruthy();
        expect(modelWithSampleId.hasLookup(SchemaQuery.create('study', 'Study'))).toBeTruthy();
        expect(modelWithSampleId.hasLookup(SchemaQuery.create('study', 'Other'))).toBeFalsy();
   });

});