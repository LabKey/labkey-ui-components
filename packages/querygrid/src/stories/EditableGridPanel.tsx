import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { boolean, number, select, text, withKnobs } from '@storybook/addon-knobs';
import { Map, fromJS } from 'immutable';
import { GRID_EDIT_INDEX, QueryColumn, QueryGridModel, QueryInfo, SchemaQuery, IGridLoader } from "@glass/base";
import mock from 'xhr-mock';

import { gridInit } from "../actions";
import { getStateQueryGridModel } from "../model";
import { initQueryGridState, setQueryMetadata } from "../global";
import { EditableGridPanel } from "../components/editable/EditableGridPanel";
import mixtureBatchesQueryInfo  from "./data/mixtureBatches-getQueryDetails.json";
import mixtureTypesQuery  from "./data/mixtureTypes-getQuery.json";

import './stories.scss'

const CONTROLS_GROUP = "Grid controls";
const PANEL_GROUP = "Grid";

const GRID_DATA = Map<any, Map<string, any>>({
    "1": Map<string, any>({
        GRID_EDIT_INDEX: 1,
        "rowid": "1",
        "Name": "name one",
        "Description": "first description"
    }),
    "2": Map<any, Map<string, any>>({
        GRID_EDIT_INDEX: 2,
        "rowid": "2",
        "Name": "name two",
        "Description": "second description"
    })
});

mock.setup();

mock.get(/.*\/query\/.*\/getQueryDetails.*/, {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(mixtureBatchesQueryInfo)
});

mock.post(/.*\/query\/.*\/getQuery.*/, {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(mixtureTypesQuery)
});

initQueryGridState();

storiesOf('EditableGridPanel', module)
    .addDecorator(withKnobs)
    .add("without data", () => {
        setQueryMetadata(fromJS({
            columnDefaults: {
                flag: {
                    removeFromViews: true
                }
            }
        }));

        const modelId = "editableWithoutData";
        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: "editableWithoutData"
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true
        });

        const addRowsControl = {
            minCount: number("Minimum count", 1, {}, CONTROLS_GROUP),
            maxCount: number("Maximum count", 100, {}, CONTROLS_GROUP),
            nounPlural: text("Plural noun", "rows", CONTROLS_GROUP),
            nounSingular: text("Singular noun", "row", CONTROLS_GROUP),
            placement: select("Placement", ['top', 'bottom', 'both'], "bottom", CONTROLS_GROUP)
        };

        return <EditableGridPanel
            addControlProps={addRowsControl}
            allowAdd={boolean("Allow rows to be added?", true, PANEL_GROUP)}
            allowBulkRemove={boolean("Allow bulk delete?", true, PANEL_GROUP)}
            allowRemove={boolean("Allow rows to be removed?", true, PANEL_GROUP)}
            disabled={boolean("Disabled?", false, PANEL_GROUP)}
            initialEmptyRowCount={number("Initial empty rows", 4, {}, PANEL_GROUP)}
            isSubmitting={boolean("Is submitting?", false, PANEL_GROUP)}
            title={text("Title", "Grid title", PANEL_GROUP)}
            model={model}
        />
    })
    .add("with data", () => {
        setQueryMetadata(fromJS({
            columnDefaults: {
                flag: {
                    removeFromViews: true
                }
            }
        }));

        const modelId = "editableWithData";
        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: "editableWithData"
        });

        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true,
            loader: {
                fetch: () => {
                    return new Promise((resolve) => {
                        resolve({
                            data: GRID_DATA,
                            dataIds: GRID_DATA.keySeq().toList(),
                        });
                    });
                }
            }
        });

        gridInit(model, true);

        const addRowsControl = {
            minCount: number("Minimum count", 1, {}, CONTROLS_GROUP),
            maxCount: number("Maximum count", 100, {}, CONTROLS_GROUP),
            nounPlural: text("Plural noun", "rows", CONTROLS_GROUP),
            nounSingular: text("Singular noun", "row", CONTROLS_GROUP),
            placement: select("Placement", ['top', 'bottom', 'both'], "bottom", CONTROLS_GROUP)
        };

        return (
            <EditableGridPanel
                addControlProps={addRowsControl}
                allowAdd={boolean("Allow rows to be added?", true, PANEL_GROUP)}
                allowBulkRemove={boolean("Allow bulk delete?", true, PANEL_GROUP)}
                allowRemove={boolean("Allow rows to be removed?", true, PANEL_GROUP)}
                disabled={boolean("Disabled?", false, PANEL_GROUP)}
                isSubmitting={boolean("Is submitting?", false, PANEL_GROUP)}
                title={text("Title", "Editable grid with data", PANEL_GROUP)}
                model={model}
            />
        )
    })
    .add("with read-only columns and placeholders", () => {
        setQueryMetadata(fromJS({
            columnDefaults: {
                flag: {
                    removeFromViews: true
                },
                name: {
                    readOnly: true
                },
                alias: {
                    placeholder: 'Enter an alias'
                }
            }
        }));

        const modelId = "editableWitReadOnlyAndPlaceHolders";
        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: "editableWitReadOnlyAndPlaceHolders"
        });

        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true,
            loader: {
                fetch: () => {
                    return new Promise((resolve) => {
                        resolve({
                            data: GRID_DATA,
                            dataIds: GRID_DATA.keySeq().toList(),
                        });
                    });
                }
            }
        });
        gridInit(model, true);

        const addRowsControl = {
            minCount: number("Minimum count", 1, {}, CONTROLS_GROUP),
            maxCount: number("Maximum count", 100, {}, CONTROLS_GROUP),
            nounPlural: text("Plural noun", "rows", CONTROLS_GROUP),
            nounSingular: text("Singular noun", "row", CONTROLS_GROUP),
            placement: select("Placement", ['top', 'bottom', 'both'], "bottom", CONTROLS_GROUP)
        };

        return (
            <EditableGridPanel
                addControlProps={addRowsControl}
                allowAdd={true}
                allowBulkRemove={false}
                allowRemove={true}
                disabled={false}
                model={model}
                isSubmitting={false}
                title={"Editable grid with read-only data"}
            />
        );
    });