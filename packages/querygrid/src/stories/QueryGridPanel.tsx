import React from 'reactn';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { QueryGridPanel } from "../components/QueryGridPanel";
import { QueryGridModel, SchemaQuery } from "@glass/base";
import { initBrowserHistoryState } from "../util/global";
import { initQueryGridState } from "../global";
import { getStateQueryGridModel } from "../model";

initQueryGridState();
initBrowserHistoryState();

import './stories.scss'

storiesOf('QueryGridPanel', module)
    .addDecorator(withKnobs)
    .add("with data", () => {
        const modelId = "gridPanelWithData";
        const schemaQuery = new SchemaQuery({
            schemaName: "exp.data",
            queryName: "mixtures"
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {});

        return <QueryGridPanel model={model}/>
    });
