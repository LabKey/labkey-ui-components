import { OrderedMap } from 'immutable'
import { QueryColumn, QueryGridModel, QueryInfo } from './model'
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

});

function createQueryInfo(rawQueryInfo: any) : QueryInfo {
    let columns = OrderedMap<string, QueryColumn>();
    Object.keys(rawQueryInfo.columns).forEach((columnKey) => {
        let rawColumn = rawQueryInfo.columns[columnKey];
        columns = columns.set(rawColumn.fieldKey.toLowerCase(), QueryColumn.create(rawColumn))
    });

    return QueryInfo.create(Object.assign({}, rawQueryInfo, {columns}))

}

describe("QueryInfo", () => {

    const FIRST_COL_KEY = "Sample Set 3 Parents";
    const SECOND_COL_KEY = "NameExpr Parents";

    let queryInfo = createQueryInfo(sampleSetQueryInfo);
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