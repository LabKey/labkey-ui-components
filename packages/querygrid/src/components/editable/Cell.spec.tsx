import React from 'reactn';
import { Map } from 'immutable';
import { mount } from "enzyme";
import { Cell } from "./Cell";
import { QueryColumn, SchemaQuery } from "@glass/base";
import { initQueryGridState } from "../../global";
import mock, { proxy } from "xhr-mock";
import { getStateQueryGridModel } from "../../model";
import * as constants from "../../test/data/constants";
import { gridInit } from "../../actions";
import mixturesQueryInfo from "../../test/data/mixtures-getQueryDetails.json";
import mixtureTypesQuery from "../../test/data/mixtureTypes-getQuery.json";

const GRID_ID = "CellTestModel";
const SCHEMA_NAME = "schema";
const QUERY_NAME = "cellTestData";
const MODEL_ID = (GRID_ID + "|" + SCHEMA_NAME + "/" + QUERY_NAME).toLowerCase();

beforeAll(() => {
    LABKEY.contextPath = "labkeyjest";
    mock.setup();

    mock.get(/.*\/query\/getQueryDetails.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(mixturesQueryInfo)
    });

    mock.post(/.*\/query\/getQuery.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(mixtureTypesQuery)
    });
    mock.use(proxy);
    initQueryGridState();

    const schemaQuery = new SchemaQuery({
        schemaName: SCHEMA_NAME,
        queryName: QUERY_NAME
    });
    const model = getStateQueryGridModel(GRID_ID, schemaQuery, {
        editable: true,
        loader: {
            fetch: () => {
                return new Promise((resolve) => {
                    resolve({
                        data: constants.GRID_DATA,
                        dataIds: constants.GRID_DATA.keySeq().toList(),
                    });
                });
            }
        }
    });

    gridInit(model, true);
});

afterAll(() => {
    mock.reset();
});

const queryColumn = QueryColumn.create({
    lookup: undefined,
    name: "myColumn"
});

const emptyRow = Map<any, any>();


describe("Cell", () => {
   test("default props", () => {
       const cell = mount(<Cell col={queryColumn} colIdx={1} modelId={MODEL_ID} row={emptyRow} rowIdx={2}/>);
       expect(cell.find("div")).toHaveLength(1);
       expect(cell.find("input")).toHaveLength(0);
       cell.simulate('doubleClick');
       cell.render();
       expect(cell.find("div")).toHaveLength(0);
       expect(cell.find("input")).toHaveLength(1);
       cell.unmount();
   });

   test("with placeholder", () => {
       const cell = mount(<Cell col={queryColumn} colIdx={2} modelId={MODEL_ID} placeholder="placeholder text" row={emptyRow} rowIdx={3}/>);
       const div = cell.find("div");
       expect(div).toHaveLength(1);
       expect(div.text()).toBe("placeholder text");
       expect(cell.find("input")).toHaveLength(0);

       cell.simulate('doubleClick');
       cell.render();
       expect(cell.find("div")).toHaveLength(0);
       const input = cell.find("input");
       expect(input).toHaveLength(1);
       expect(input.prop("placeholder")).toBe("placeholder text");
       cell.unmount();
   });

   test("readOnly property", () => {
       const cell = mount(<Cell col={queryColumn} colIdx={3} modelId={MODEL_ID} readOnly={true} row={emptyRow} rowIdx={3}/>);
       cell.simulate('doubleClick');
       cell.render();
       expect(cell.find("div")).toHaveLength(1);
       expect(cell.find("input")).toHaveLength(0);
       cell.unmount();
   });

   test("column is readOnly", () => {
       const roColumn = QueryColumn.create({
           readOnly: true,
           name: "roColumn"
       });
       const cell = mount(<Cell col={roColumn} colIdx={4} modelId={MODEL_ID} readOnly={false} row={emptyRow} rowIdx={3}/>);
       cell.simulate('doubleClick');
       cell.render();
       expect(cell.find("div")).toHaveLength(1);
       expect(cell.find("input")).toHaveLength(0);
       cell.unmount();
   });

   test("with placeholder and readOnly", () => {
       const cell = mount(<Cell col={queryColumn} colIdx={3} modelId={MODEL_ID} placeholder="readOnly placeholder" readOnly={true} row={emptyRow} rowIdx={3}/>);

       const div = cell.find("div");
       expect(div).toHaveLength(1);
       expect(div.text()).toBe("readOnly placeholder");
       cell.simulate('doubleClick');
       cell.render();
       expect(cell.find("div")).toHaveLength(1);
       expect(cell.find("input")).toHaveLength(0);
       cell.unmount();
   });
});