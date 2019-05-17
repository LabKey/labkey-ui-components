import React from 'reactn';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { SchemaQuery } from "@glass/base";

import { getStateQueryGridModel } from "../model";
import { QueryInfoForm } from "../components/forms/QueryInfoForm";
import * as constants from "../test/data/constants";
import { gridInit } from "../actions";
import './stories.scss'

function formSubmit(data: any) : Promise<any> {
    return new Promise((resolve, reject) => {
        resolve( console.log("resolved"))
    });
}

storiesOf('QueryInfoForm', module)
    .addDecorator(withKnobs)
    .add("default", () => {
        const modelId = "defaultForm";
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
                onSubmit={formSubmit}
                asModal={false}
                queryInfo={model.queryInfo}
                schemaQuery={schemaQuery}/>
        )
    })
    .add("with knobs", () => {
        const modelId = "customizableForm";
        const schemaQuery = new SchemaQuery({
            schemaName: "exp.data",
            queryName: "mixtures"
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
                header={text("Form header", undefined)}
                checkRequiredFields={boolean("Check required fields?", undefined)}
                allowMultiple={boolean("Include count field?", true)}
                maxCount={number("Max count", 100)}
                countText={text("Count text", "Quantity")}
                singularNoun={text("Singular noun", undefined)}
                pluralNoun={text("Plural noun", undefined)}
                cancelText={text("Cancel text", "Cancel")}
                isSubmittedText={text("Is submitted text", "Submitted")}
                isSubmittingText={text("Is submitting text", "Submitting...")}
                asModal={boolean("As modal?", false)}
                title={text("Modal title", "Title")}
                queryInfo={model.queryInfo}
                onSubmit={formSubmit}
                schemaQuery={schemaQuery}
                />
        )
    });