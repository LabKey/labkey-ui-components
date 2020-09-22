/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs';

import { getStateQueryGridModel } from '../models';
import { QueryInfoForm } from '../internal/components/forms/QueryInfoForm';
import * as constants from '../test/data/constants';
import { gridInit } from '../actions';
import './stories.scss';
import { getQueryGridModel } from '../global';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { QueryGridModel, SchemaQuery } from '../internal/components/base/models/model';

function formSubmit(data: any): Promise<any> {
    console.log(data);
    return new Promise((resolve, reject) => {
        resolve(console.log('resolved'));
    });
}

function formSubmitForEdit(data: any): Promise<any> {
    console.log(data);
    return new Promise((resolve, reject) => {
        resolve(console.log('resolved for edit'));
    });
}

function onFormChange() {
    console.log('form edit detected');
}

const SUBMIT_GROUP = 'Submit';
const TEXT_GROUP = 'Text display';

interface Props {
    schemaQuery: SchemaQuery;
    fieldValues?: any;
}

class QueryInfoFormPage extends React.Component<Props, any> {
    UNSAFE_componentWillMount(): void {
        this.initModel();
    }

    initModel() {
        const sampleModel = this.getQueryGridModel();
        gridInit(sampleModel, true, this);
    }

    getQueryGridModel(): QueryGridModel {
        const model = getStateQueryGridModel('queryInfoForm', this.props.schemaQuery, {
            editable: true,
            loader: {
                fetch: () => {
                    return new Promise(resolve => {
                        resolve({
                            data: constants.GRID_DATA,
                            dataIds: constants.GRID_DATA.keySeq().toList(),
                        });
                    });
                },
            },
        });
        return getQueryGridModel(model.getId()) || model;
    }

    onUpdate = () => {
        alert('Note: we did not actually save anything to the server (there is no server).');
    };

    render() {
        const model = this.getQueryGridModel();
        if (!model.isLoaded) {
            return <LoadingSpinner />;
        }

        return (
            <QueryInfoForm
                allowFieldDisable={boolean('Allow fields to be disabled?', true)}
                initiallyDisableFields={true}
                includeCountField={false}
                checkRequiredFields={false}
                renderFileInputs={boolean('Render file inputs?', false)}
                queryInfo={model.queryInfo}
                fieldValues={this.props.fieldValues}
                onSubmit={formSubmit}
                schemaQuery={this.props.schemaQuery}
            />
        );
    }
}

storiesOf('QueryInfoForm', module)
    .addDecorator(withKnobs)
    .add('default', () => {
        // FIXME: This story is broken, not sure of fix. We don't have our mocks wired up for schemaName=schema
        //  queryName=defaultForm
        const modelId = 'defaultForm';
        const schemaQuery = new SchemaQuery({
            schemaName: 'schema',
            queryName: modelId,
        });

        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true,
            loader: {
                fetch: () => {
                    return new Promise(resolve => {
                        resolve({
                            data: constants.GRID_DATA,
                            dataIds: constants.GRID_DATA.keySeq().toList(),
                        });
                    });
                },
            },
        });
        gridInit(model, true);

        return (
            <QueryInfoForm
                onSubmit={formSubmit}
                asModal={false}
                queryInfo={model.queryInfo}
                schemaQuery={schemaQuery}
            />
        );
    })
    .add('check required fields', () => {
        const modelId = 'customizableForm';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixtures',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true,
            loader: {
                fetch: () => {
                    return new Promise(resolve => {
                        resolve({
                            data: constants.GRID_DATA,
                            dataIds: constants.GRID_DATA.keySeq().toList(),
                        });
                    });
                },
            },
        });
        gridInit(model, true);
        return (
            <QueryInfoForm
                header={text('Form header', undefined, TEXT_GROUP)}
                footer={text('Form footer', undefined, TEXT_GROUP)}
                checkRequiredFields={true}
                includeCountField={boolean('Include count field?', true)}
                maxCount={number('Max count', 100)}
                countText={text('Count text', 'Quantity', TEXT_GROUP)}
                singularNoun={text('Singular noun', undefined, TEXT_GROUP)}
                pluralNoun={text('Plural noun', undefined, TEXT_GROUP)}
                cancelText={text('Cancel text', 'Cancel', TEXT_GROUP)}
                isSubmittedText={text('Is submitted text', 'Submitted', SUBMIT_GROUP)}
                isSubmittingText={text('Is submitting text', 'Submitting...', SUBMIT_GROUP)}
                asModal={boolean('As modal?', false)}
                isLoading={boolean('Is loading?', false)}
                submitForEditText={text('Submit for edit text', undefined, SUBMIT_GROUP)}
                title={text('Modal title', 'Title', TEXT_GROUP)}
                queryInfo={model.queryInfo}
                onSubmit={formSubmit}
                onSubmitForEdit={
                    boolean('Add submit for edit button?', false, 'Submit') ? formSubmitForEdit : undefined
                }
                canSubmitForEdit={boolean('Can submit for edit?', true, 'Submit')}
                disableSubmitForEditMsg={text(
                    'Message tip for disable submit for edit',
                    'Editing with grid not possible',
                    'Submit'
                )}
                schemaQuery={schemaQuery}
            />
        );
    })
    .add("don't check required fields", () => {
        const modelId = 'customizableForm';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixtures',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true,
            loader: {
                fetch: () => {
                    return new Promise(resolve => {
                        resolve({
                            data: constants.GRID_DATA,
                            dataIds: constants.GRID_DATA.keySeq().toList(),
                        });
                    });
                },
            },
        });
        gridInit(model, true);
        return (
            <QueryInfoForm
                checkRequiredFields={false}
                includeCountField={boolean('Include count field?', true)}
                showLabelAsterisk={boolean("Show '*' for required field", false)}
                maxCount={number('Max count', 100)}
                queryInfo={model.queryInfo}
                onSubmit={formSubmit}
                schemaQuery={schemaQuery}
            />
        );
    })
    .add('with field values', () => {
        const modelId = 'formWithInitialValues';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixtures',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true,
            loader: {
                fetch: () => {
                    return new Promise(resolve => {
                        resolve({
                            data: constants.GRID_DATA,
                            dataIds: constants.GRID_DATA.keySeq().toList(),
                        });
                    });
                },
            },
        });
        const fieldValues = {
            description: 'How to describe it...',
            extratestcolumn: 'Extra data',
        };
        gridInit(model, true);
        return (
            <QueryInfoForm
                allowFieldDisable={boolean('Allow disabling of fields?', false)}
                includeCountField={boolean('Include count field?', true)}
                maxCount={number('Max count', 100)}
                queryInfo={model.queryInfo}
                fieldValues={fieldValues}
                onSubmit={formSubmit}
                schemaQuery={schemaQuery}
            />
        );
    })
    .add('allow fields to be disabled', () => {
        const modelId = 'canDisableFieldsForm';
        const schemaQuery = new SchemaQuery({
            schemaName: 'samples',
            queryName: 'SampleSetWithAllFieldTypes',
        });
        const fieldValues = {
            description: 'How to describe it...',
            integer: '3',
            text: 'The text goes here',
        };
        return <QueryInfoFormPage fieldValues={fieldValues} schemaQuery={schemaQuery} />;
    })
    .add('toggle check change for submit', () => {
        const modelId = 'customizableForm';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixtures',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true,
            loader: {
                fetch: () => {
                    return new Promise(resolve => {
                        resolve({
                            data: constants.GRID_DATA,
                            dataIds: constants.GRID_DATA.keySeq().toList(),
                        });
                    });
                },
            },
        });
        gridInit(model, true);
        return (
            <QueryInfoForm
                checkRequiredFields={false}
                includeCountField={boolean('Include count field?', false)}
                canSubmitNotDirty={boolean('Can submit without change?', false)}
                onFormChange={boolean('Use onFormChange (check console log)?', true) ? onFormChange : null}
                queryInfo={model.queryInfo}
                onSubmit={formSubmit}
                schemaQuery={schemaQuery}
            />
        );
    });
