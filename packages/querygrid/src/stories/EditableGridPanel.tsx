import React from 'reactn';
import { storiesOf } from "@storybook/react";
import { boolean, number, select, text, withKnobs } from '@storybook/addon-knobs';

import { List, Map, OrderedMap } from 'immutable';
import { GRID_EDIT_INDEX, QueryColumn, QueryGridModel, QueryInfo, SchemaQuery } from "@glass/base";
import { initQueryGridState, updateQueryGridModel } from "../global";
import { bindQueryInfo, gridInit, gridLoad, initEditorModel, loadDataForEditor } from "../actions";
import { EditableGridPanel } from "../components/editable/EditableGridPanel"
import samplesQueryInfo  from "./data/samplesQueryInfo.json"
import mock from 'xhr-mock';

import './stories.scss'


const MODEL_GROUP = "Query grid model";
const CONTROLS_GROUP = "Grid controls";
const PANEL_GROUP = "Grid";

initQueryGridState();

const queryInfo = () => QueryInfo.create({
    "pkCols": [
        "RowId"
    ],
    "canEditSharedViews": true,
    "insertUrl": "\/labkey\/Biologics\/query-insertQueryRow.view?schemaName=samples&query.queryName=MixtureBatches",
    "columns": OrderedMap<string, QueryColumn>({
        "rowid": QueryColumn.create({
            "align": "right",
            "caption": "Row Id",
            "conceptURI": null,
            "defaultValue": null,
            "description": "Contains the unique identifier for this sample",
            "fieldKey": "RowId",
            "fieldKeyArray": [
                "RowId"
            ],
            "hidden": true,
            "inputType": "text",
            "isKeyField": true,
            "jsonType": "int",
            "multiValue": false,
            "name": "RowId",
            "rangeURI": null,
            "readOnly": true,
            "required": true,
            "shortCaption": "Row Id",
            "shownInInsertView": false,
            "shownInUpdateView": false,
            "sortable": true,
            "type": "Integer",
            "userEditable": false,
            "removeFromViews": false
        }),
        "name": QueryColumn.create({
            "align": "left",
            "caption": text("Name field caption", "Name", PANEL_GROUP),
            "conceptURI": null,
            "defaultValue": null,
            "description": "Contains a short description for this sample\nIf not provided, a unique name will be generated from the expression:\nB-${now:date}-${dailySampleCount}",
            "fieldKey": "Name",
            "fieldKeyArray": [
                "Name"
            ],
            "hidden": false,
            "inputType": "text",
            "isKeyField": false,
            "jsonType": "string",
            "multiValue": false,
            "name": "Name",
            "rangeURI": null,
            "readOnly": false,
            "required": boolean("Name field required?", true, PANEL_GROUP),
            "shortCaption": "Name",
            "shownInInsertView": true,
            "shownInUpdateView": true,
            "sortable": true,
            "type": "Text (String)",
            "userEditable": true,
            "removeFromViews": false
        }),
        "value": QueryColumn.create({
            "align": "left",
            "caption": text("Value field caption", "Value", PANEL_GROUP),
            "conceptURI": null,
            "defaultValue": null,
            "description": "Contains a value for this sample",
            "fieldKey": "Value",
            "fieldKeyArray": [
                "Value"
            ],
            "hidden": false,
            "inputType": "text",
            "isKeyField": false,
            "jsonType": "string",
            "multiValue": false,
            "name": "Value",
            "rangeURI": null,
            "readOnly": false,
            "required": boolean("Value field required?", false, PANEL_GROUP),
            "shortCaption": "Value",
            "shownInInsertView": true,
            "shownInUpdateView": true,
            "sortable": true,
            "type": "Text (String)",
            "userEditable": true,
            "removeFromViews": false
        })
    })
});

const data = Map<any, Map<string, any>>({
    "1": Map<string, any>({
        GRID_EDIT_INDEX: 1,
        "rowid": "1",
        "Name": "name one",
        "Value": "first value"
    }),
    "2": Map<any, Map<string, any>>({
        GRID_EDIT_INDEX: 2,
        "rowid": "2",
        "Name": "name two",
        "Value": "second value"
    })
});

const dataIds = List<any>(["1", "2"]);

storiesOf('EditableGridPanel', module)
    .addDecorator(withKnobs)
    .add("without data", () => {
        const modelId = "editableWithoutData";
        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: "q-snapshot"
        });

        // console.log(samplesQueryInfo.columns);
        // let columns = OrderedMap<string, QueryColumn>().asMutable();
        // samplesQueryInfo.columns.forEach((rawColumn) => {
        //     columns.set(rawColumn.fieldKey.toLowerCase(), applyColumnMetadata(schemaQuery, rawColumn))
        // });
        // columns = columns.asImmutable();
        // samplesQueryInfo.columns = columns;
        let model = new QueryGridModel({
            data: Map<string, Map<string, any>>(),
            dataIds: List<any>(),
            editable: true,
            id: modelId,
            isLoaded: boolean("isLoaded?", true, MODEL_GROUP),
            isLoading: boolean("isLoading?", false, MODEL_GROUP),
            isError: boolean("isError?", false, MODEL_GROUP),
            schema: schemaQuery.schemaName,
            query: schemaQuery.queryName,
            queryInfo: queryInfo(),
        });
        initEditorModel(model);

        updateQueryGridModel(model, {}, undefined, false);
        loadDataForEditor(model);
        let addRowsControl = {
            minCount: number("Minimum count", 1, {}, CONTROLS_GROUP),
            maxCount: number("Maximum count", 100, {}, CONTROLS_GROUP),
            nounPlural: text("Plural noun", "rows", CONTROLS_GROUP),
            nounSingular: text("Singular noun", "row", CONTROLS_GROUP),
            placement: select("Placement", ['top', 'bottom', 'both'], "bottom", CONTROLS_GROUP)
        };

        return <EditableGridPanel
            addControlProps={addRowsControl}
            allowAdd={boolean("Allow rows to be added?", true, PANEL_GROUP)}
            allowBulkDelete={boolean("Allow bulk delete?", true, PANEL_GROUP)}
            allowRemove={boolean("Allow rows to be removed?", true, PANEL_GROUP)}
            disabled={boolean("Disabled?", false, PANEL_GROUP)}
            initialEmptyRowCount={number("Initial empty rows", 4, {}, PANEL_GROUP)}
            model={model}
            isSubmitting={boolean("Is submitting?", false, PANEL_GROUP)}
            title={text("Title", "Grid title", PANEL_GROUP)}
        />
    })
    .add("With data", () => {
        const modelId = "editableWithData";
        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: "editableData"
        });
        let model = new QueryGridModel({
            data: data,
            dataIds: dataIds,
            editable: true,
            id: modelId,
            isLoaded: true,
            isLoading: false,
            isError: false,
            schema: schemaQuery.schemaName,
            query: schemaQuery.queryName,
            queryInfo: queryInfo()
        });
        let addRowsControl = {
            minCount:  1,
            maxCount:  100,
            nounPlural:  "rows",
            nounSingular: "row",
            placement: select("Controls placement", ['top', 'bottom', 'both'], "bottom")
        };

        // This does seem to set up a mock response, but the promise that uses
        // this response gets "undefined" for teh queryDetails objec for some reason.
        // mock.setup();
        //
        // console.log("samplesQueryInfo", samplesQueryInfo);
        // mock.get('labkey/query/testContainer/getQueryDetails.api?schemaName=schema&queryName=editableData&viewName=*', {
        //     status: 200,
        //     body: samplesQueryInfo
        // });

        let response = {
            data: data.toList()
        };

        let newModel = updateQueryGridModel(model, {
            queryInfo: bindQueryInfo(model.queryInfo)
        }, undefined, false);
        initEditorModel(newModel);
        loadDataForEditor(newModel, response);

        return (
            <EditableGridPanel
                addControlProps={addRowsControl}
                allowAdd={true}
                allowBulkDelete={true}
                allowRemove={true}
                disabled={false}
                initialEmptyRowCount={4}
                model={newModel}
                isSubmitting={false}
                title={"Editable grid with data"}
            />
        )
    })

;