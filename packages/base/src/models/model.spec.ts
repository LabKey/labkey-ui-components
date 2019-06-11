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

   describe("getCommonDataForSelection", () => {
       test("nothing common", () => {
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
               selectedIds: List(["1", "2"])
           });
           expect(model.getCommonDataForSelection()).toEqual({});
       });

       test("undefined and missing values", () => {

           const model = new QueryGridModel({
               data: fromJS({
                   "1": {
                       "field1": {
                           "value": undefined
                       },
                       "field2": {
                           "value": "value2"
                       },
                       "field3": {
                           "value": null
                       }
                   },
                   "2": {
                       "field1": {
                           value: "value1"
                       },
                       "field3": {
                           value: "value3"
                       },
                   }
               }),
               selectedIds: List(["1", "2"])
           });
           expect(model.getCommonDataForSelection()).toEqual({
               "field1": "value1",
               "field2": "value2",
               "field3": "value3"
           });
       });

       test("same common values", () => {
           const model = new QueryGridModel({
               "data" : fromJS({
                   "448": {
                       "RowId" : {
                           "value" : 448,
                           "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448"
                       },
                       "Value" : {
                           "value" : null
                       },
                       "Data" : {
                           "value" : "data1"
                       },
                       "AndAgain" : {
                           "value" : "again"
                       },
                       "Name" : {
                           "value" : "S-20190516-9042",
                           "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448"
                       },
                       "Other" : {
                           "value" : "other1"
                       }
                   },
                   "447": {
                       "RowId" : {
                           "value" : 447,
                           "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447"
                       },
                       "Value" : {
                           "value" : null
                       },
                       "Data" : {
                           "value" : "data1"
                       },
                       "AndAgain" : {
                           "value" : "again"
                       },
                       "Name" : {
                           "value" : "S-20190516-4622",
                           "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447"
                       },
                       "Other" : {
                           "value" : "other2"
                       }
                   },
                   "446": {
                       "RowId" : {
                           "value" : 446,
                           "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446"
                       },
                       "Value" : {
                           "value" : "val"
                       },
                       "Data" : {
                           "value" : "data1"
                       },
                       "AndAgain" : {
                           "value" : "again"
                       },
                       "Name" : {
                           "value" : "S-20190516-2368",
                           "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446"
                       },
                       "Other" : {
                           "value" : "other3"
                       }
                   },
                   "445":{
                       "RowId" : {
                           "value" : 445,
                           "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445"
                       },
                       "Value" : {
                           "value" : "val"
                       },
                       "Data" : {
                           "value" : "data1"
                       },
                       "AndAgain" : {
                           "value" : "again"
                       },
                       "Name" : {
                           "value" : "S-20190516-9512",
                           "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445"
                       },
                       "Other" : {
                           "value" : null
                       }
                   },
                   "367": {
                       "RowId" : {
                           "value" : 367,
                           "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=367"
                       },
                       "Value" : {
                           "value" : null
                       },
                       "Data" : {
                           "value" : "data1"
                       },
                       "AndAgain" : {
                           "value" : null
                       },
                       "Name" : {
                           "value" : "S-20190508-5534",
                           "url" : "/labkey/Sample%20Management/experiment-showMaterial.view?rowId=367"
                       },
                       "Other" : {
                           "value" : null
                       }
                   }
               }),
               selectedIds: List(["446", "447", "448"])
           });
           expect(model.getCommonDataForSelection()).toEqual({
               "Value": "val",
               "AndAgain": "again",
               "Data": "data1"
           });
       });
   });

});

describe("QueryInfo", () => {

    const FIRST_COL_KEY = "Sample Set 3 Parents";
    const SECOND_COL_KEY = "NameExpr Parents";

    let queryInfo = QueryInfo.fromJSON(sampleSetQueryInfo);
    let newColumns = OrderedMap<string, QueryColumn>();
    newColumns = newColumns.set(FIRST_COL_KEY, QueryColumn.create(sampleSet3QueryColumn));
    newColumns = newColumns.set(SECOND_COL_KEY, QueryColumn.create(nameExpSetQueryColumn));

    test("insertColumns negative columnIndex", () => {
        const columns = queryInfo.insertColumns(-1, newColumns);
        expect(columns).toBe(queryInfo.columns);
    });

    test("insertColumns columnIndex just too large", () => {
        const columns = queryInfo.insertColumns(queryInfo.columns.size+1, newColumns);
        expect(columns).toBe(queryInfo.columns);
    });

    test("insertColumns as first column", () => {
        const columns = queryInfo.insertColumns(0, newColumns);
        const firstColKey = queryInfo.columns.keySeq().first();
        expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(0);
        expect(columns.keySeq().indexOf(SECOND_COL_KEY)).toBe(1);
        expect(columns.keySeq().indexOf(firstColKey)).toBe(2);
        expect(columns.size).toBe(queryInfo.columns.size + newColumns.size);
    });

    test("insertColumns as last column", () => {
        const columns = queryInfo.insertColumns(queryInfo.columns.size, newColumns);
        const firstColKey = queryInfo.columns.keySeq().first();
        expect(columns.size).toBe(queryInfo.columns.size + newColumns.size);
        expect(columns.keySeq().indexOf(firstColKey)).toBe(0);
        expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(queryInfo.columns.size);
        expect(columns.keySeq().indexOf(SECOND_COL_KEY)).toBe(queryInfo.columns.size + 1);
    });

    test("insertColumns in middle", () => {
        const nameIndex = queryInfo.columns.keySeq().findIndex((key) => (key.toLowerCase() === 'name'));
        const columns = queryInfo.insertColumns(nameIndex+1, newColumns);
        expect(columns.size).toBe(queryInfo.columns.size + newColumns.size);
        expect(columns.keySeq().get(nameIndex).toLowerCase()).toBe("name");
        expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(nameIndex + 1);
        expect(columns.keySeq().indexOf(SECOND_COL_KEY)).toBe(nameIndex + 2);
    });

    test("insertColumns, single column", () => {
        const nameIndex = queryInfo.columns.keySeq().findIndex((key) => (key.toLowerCase() === 'name'));
        const columns = queryInfo.insertColumns(nameIndex+1, newColumns.filter((queryColumn) => (queryColumn.caption.toLowerCase() === FIRST_COL_KEY.toLowerCase())).toOrderedMap());
        expect(columns.size).toBe(queryInfo.columns.size + 1);
        expect(columns.keySeq().get(nameIndex).toLowerCase()).toBe("name");
        expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(nameIndex + 1);
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