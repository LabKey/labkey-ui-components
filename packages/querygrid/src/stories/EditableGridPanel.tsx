import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { boolean, number, select, text, withKnobs } from '@storybook/addon-knobs';
import { fromJS, Map } from 'immutable';
import { SchemaQuery } from "@glass/base";

import { gridInit } from "../actions";
import { getStateQueryGridModel } from "../model";
import { initQueryGridState, setQueryMetadata } from "../global";
import { EditableGridPanel } from "../components/editable/EditableGridPanel";
import * as constants from '../test/data/constants';

import './stories.scss'
import { EditableColumnMetadata } from "../components/editable/EditableGrid";

const CONTROLS_GROUP = "Grid controls";
const PANEL_GROUP = "Grid";

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

        return (
            <EditableGridPanel
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
        );

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
                            data: constants.GRID_DATA,
                            dataIds: constants.GRID_DATA.keySeq().toList(),
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
        );
    })
    .add("with read-only columns and placeholders", () => {
        setQueryMetadata(fromJS({
            columnDefaults: {
                flag: {
                    removeFromViews: true
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
                            data: constants.GRID_DATA,
                            dataIds: constants.GRID_DATA.keySeq().toList(),
                        });
                    });
                }
            }
        });
        gridInit(model, true);


        const columnMetadata = Map<string, EditableColumnMetadata>({
            "Name": {
                readOnly: boolean("Name field read-only?", true)
            },
            "mixtureTypeId": {
                placeholder : text("Mixture Type placeholder text", "Select a type...")
            },
            "extraTestColumn": {
                placeholder : text("Extra Test Column placeholder text", "Enter text here")
            }
        });

        return (
            <EditableGridPanel
                allowAdd={true}
                allowBulkRemove={true}
                allowRemove={true}
                columnMetadata={columnMetadata}
                disabled={false}
                model={model}
                isSubmitting={false}
                title={"Editable grid with read-only data"}
            />
        );
    })
    .add("with bulk edit", () => {
        setQueryMetadata(fromJS({
            columnDefaults: {
                flag: {
                    removeFromViews: true
                }
            }
        }));

        const modelId = "editableWithBulkEdit";
        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: modelId
        });

        const model = getStateQueryGridModel(modelId, schemaQuery, {
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

        const bulkUpdateProps = {
            header: text("Header for bulk insert", "Create some mixture data here."),
            title: text("Title for bulk import", "Bulk creation of mixture data")
        };

        return (
            <EditableGridPanel
                allowAdd={true}
                allowBulkRemove={boolean("Allow bulk remove?", false)}
                allowBulkUpdate={true}
                model={model}
                isSubmitting={false}
                bulkUpdateProps={bulkUpdateProps}
                bulkUpdateText={text("Bulk Update text", "Bulk Insert")}
                title={"Editable grid with bulk insert capabilities"}
            />
        );
    });