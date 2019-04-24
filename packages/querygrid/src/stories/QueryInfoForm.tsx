import React from 'reactn';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { QueryGrid } from "../components/QueryGrid";
import { QueryGridModel, SchemaQuery } from "@glass/base";
import { initBrowserHistoryState } from "../util/global";
import { initQueryGridState, updateQueryGridModel } from "../global";
import mixtureBatchesQueryInfo from "../test/data/mixtureBatches-getQueryDetails.json";

initQueryGridState();
initBrowserHistoryState();

import './stories.scss'
import { QueryInfoForm } from "../components/forms/QueryInfoForm";
import { getStateQueryGridModel } from "../model";
import * as constants from "../test/data/constants";
import { gridInit } from "../actions";

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
        return <QueryInfoForm queryInfo={model.queryInfo} schemaQuery={schemaQuery}/>
    });