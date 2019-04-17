import React from 'reactn';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { QueryGrid } from "../components/QueryGrid";
import { QueryGridModel, SchemaQuery } from "@glass/base";
import { initBrowserHistoryState } from "../util/global";
import { initQueryGridState, updateQueryGridModel } from "../global";

initQueryGridState();
initBrowserHistoryState();

import './stories.scss'

storiesOf('QueryGrid', module)
    .addDecorator(withKnobs)
    .add('No data available', () => {
        const modelId = "basicRendering";
        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: "q-snapshot"
        });
        const model = new QueryGridModel({
            allowSelection: boolean("allowSelection?", false),
            id: modelId,
            isLoaded: boolean("isLoaded?", true),
            isLoading: boolean("isLoading?", false),
            isError: boolean("isError?", false),
            schema: schemaQuery.schemaName,
            query: schemaQuery.queryName,
        });
        updateQueryGridModel(model, {}, undefined, false);
        return <QueryGrid model={model} schemaQuery={schemaQuery}/>
    })
    // .add("Some data", () => {
    //
    // })
;
