import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { SchemaQuery } from "@glass/base";

import { getStateQueryGridModel } from "../models";
import { QueryInfoForm } from "../components/forms/QueryInfoForm";
import * as constants from "../test/data/constants";
import { gridInit } from "../actions";
import './stories.scss'

function formSubmit(data: any) : Promise<any> {
    console.log(data);
    return new Promise((resolve, reject) => {
        resolve( console.log("resolved"))
    });
}

function formSubmitForEdit(data: any) : Promise<any> {
    console.log(data);
    return new Promise((resolve, reject) => {
        resolve( console.log("resolved for edit"))
    });
}

const SUBMIT_GROUP = "Submit";
const TEXT_GROUP = "Text display";

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
    .add("check required fields", () => {
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
                header={text("Form header", undefined, TEXT_GROUP)}
                footer={text("Form footer", undefined, TEXT_GROUP)}
                checkRequiredFields={true}
                includeCountField={boolean("Include count field?", true)}
                maxCount={number("Max count", 100)}
                countText={text("Count text", "Quantity", TEXT_GROUP)}
                singularNoun={text("Singular noun", undefined, TEXT_GROUP)}
                pluralNoun={text("Plural noun", undefined, TEXT_GROUP)}
                cancelText={text("Cancel text", "Cancel", TEXT_GROUP)}
                isSubmittedText={text("Is submitted text", "Submitted", SUBMIT_GROUP)}
                isSubmittingText={text("Is submitting text", "Submitting...", SUBMIT_GROUP)}
                asModal={boolean("As modal?", false)}
                submitForEditText={text("Submit for edit text", undefined, SUBMIT_GROUP)}
                title={text("Modal title", "Title", TEXT_GROUP)}
                queryInfo={model.queryInfo}
                onSubmit={formSubmit}
                onSubmitForEdit={boolean("Add submit for edit button?", false, "Submit") ?  formSubmitForEdit : undefined}
                schemaQuery={schemaQuery}
                />
        )
    })
    .add("don't check required fields", () => {
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
                checkRequiredFields={false}
                includeCountField={boolean("Include count field?", true)}
                maxCount={number("Max count", 100)}
                queryInfo={model.queryInfo}
                onSubmit={formSubmit}
                schemaQuery={schemaQuery}
            />
        )
    })
    .add("with field values", () => {
        const modelId = "formWithInitialValues";
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
        const fieldValues = {
            'description': 'How to describe it...',
            'extratestcolumn': "Extra data"
        };
        gridInit(model, true);
        return (
            <QueryInfoForm
                allowFieldDisable={boolean("Allow disabling of fields?", false)}
                includeCountField={boolean("Include count field?", true)}
                maxCount={number("Max count", 100)}
                queryInfo={model.queryInfo}
                fieldValues={fieldValues}
                onSubmit={formSubmit}
                schemaQuery={schemaQuery}
            />
        )
    })
    .add("allow fields to be disabled", () => {
        const modelId = "canDisableFieldsForm";
        const schemaQuery = new SchemaQuery({
            schemaName: "samples",
            queryName: "SampleSetWithAllFieldTypes"
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
        const fieldValues = {
            'description': 'How to describe it...',
            'integer': "3",
            'text': "The text goes here"
        };
        gridInit(model, true);
        return (
            <QueryInfoForm
                allowFieldDisable={true}
                initiallyDisableFields={true}
                includeCountField={false}
                checkRequiredFields={false}
                renderFileInputs={boolean("Render file inputs?", false)}
                queryInfo={model.queryInfo}
                fieldValues={fieldValues}
                onSubmit={formSubmit}
                schemaQuery={schemaQuery}
            />
        )
    })

;