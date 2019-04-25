import React from 'reactn';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { SchemaQuery } from "@glass/base";
import { initBrowserHistoryState } from "../util/global";
import { initQueryGridState } from "../global";
import './stories.scss'
import { QueryInfoForm } from "../components/forms/QueryInfoForm";
import { getStateQueryGridModel } from "../model";
import * as constants from "../test/data/constants";
import { gridInit } from "../actions";

initQueryGridState();
initBrowserHistoryState();

storiesOf('QueryInfoForm', module)
    .addDecorator(withKnobs)
    .add("default", () => {
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
        return (
            <QueryInfoForm
                queryInfo={model.queryInfo}
                schemaQuery={schemaQuery}/>
        )
    });