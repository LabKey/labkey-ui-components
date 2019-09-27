/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { List } from 'immutable'
import { storiesOf } from '@storybook/react'
import { text, boolean, withKnobs } from '@storybook/addon-knobs'

import { AssayProtocolModel, DomainDesign } from "../models";
import { AssayDesignerPanels } from "../components/assay/AssayDesignerPanels"
import { initMocks } from "./mock";
import './stories.scss'

initMocks();

storiesOf("AssayDesignerPanels", module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {
        const model  = new AssayProtocolModel({
            providerName: 'General',
            allowBackgroundUpload: true,
            allowEditableResults: true,
            allowQCStates: true,
            allowSpacesInPath: true,
            allowTransformationScript: true,
            availablePlateTemplates: ['Template 1', 'Template 2'],
            availableDetectionMethods: ['Method 1', 'Method 2'],
            availableMetadataInputFormats: {MANUAL: 'Manual', FILE_BASED: 'File Based'},
            domains: List([
                DomainDesign.init('Batch'),
                DomainDesign.init('Run'),
                DomainDesign.init('Data')
            ])
        });

        return (
            <AssayDesignerPanels
                initModel={model}
                hideEmptyBatchDomain={boolean('hideEmptyBatchDomain', false)}
                onChange={(model: AssayProtocolModel) => {
                    console.log('change', model.toJS());
                }}
                onComplete={(model: AssayProtocolModel) => {
                    console.log('complete clicked', model.toJS());
                }}
                onCancel={() => {
                    console.log('cancel clicked');
                }}
            />
        )
    })
    .add("with initModel", () => {
        const model = AssayProtocolModel.create({
            protocolId: 1,
            name: 'Test Assay Protocol',
            description: 'My assay protocol for you all to use.',
            allowBackgroundUpload: true,
            allowEditableResults: true,
            allowQCStates: true,
            allowSpacesInPath: true,
            allowTransformationScript: true,
            editableRuns: true,
            editableResults: true,
            availablePlateTemplates: ['Template 1', 'Template 2'],
            availableDetectionMethods: ['Method 1', 'Method 2'],
            availableMetadataInputFormats: {MANUAL: 'Manual', FILE_BASED: 'File Based'},
            domains: [{
                name: 'Sample Fields',
                fields: [{
                    name: 'field1',
                    rangeURI: 'xsd:string'
                },{
                    name: 'field2',
                    rangeURI: 'xsd:int'
                },{
                    name: 'field3',
                    rangeURI: 'xsd:dateTime'
                }]
            }]
        });

        return (
            <AssayDesignerPanels
                initModel={model}
                onChange={(model: AssayProtocolModel) => {
                    console.log('change', model.toJS());
                }}
                onComplete={(model: AssayProtocolModel) => {
                    console.log('complete clicked', model.toJS());
                }}
                onCancel={() => {
                    console.log('cancel clicked');
                }}
            />
        )
    });