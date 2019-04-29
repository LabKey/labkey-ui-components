import React from 'reactn';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { QueryGrid } from "../components/QueryGrid";
import { QueryGridModel, SchemaQuery } from "@glass/base";
import { initBrowserHistoryState } from "../util/global";
import { initQueryGridState, updateQueryGridModel } from "../global";
import { initQueryGridState } from "../global";
import { getStateQueryGridModel } from "../model";

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
    .add('without data', () => {
        const modelId = "gridWithoutData";
        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: "gridWithoutData"
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            allowSelection: false
        });

        return <QueryGrid model={model}/>
    })
    .add("with data", () => {
        const modelId = "gridWithData";
        const schemaQuery = new SchemaQuery({
            schemaName: "exp.data",
            queryName: "mixtures"
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {});

        return <QueryGrid model={model}/>
    });
