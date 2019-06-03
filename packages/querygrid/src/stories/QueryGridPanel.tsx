import React from 'reactn';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { QueryGridPanel } from "../components/QueryGridPanel";
import { SchemaQuery } from "@glass/base";
import { getStateQueryGridModel } from "../models";

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
