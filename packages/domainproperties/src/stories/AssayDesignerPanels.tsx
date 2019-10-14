/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { text, boolean, withKnobs } from '@storybook/addon-knobs'

import { AssayProtocolModel } from "../models";
import { AssayDesignerPanels } from "../components/assay/AssayDesignerPanels"
import { initMocks } from "./mock";
import './stories.scss'

initMocks();

storiesOf("AssayDesignerPanels", module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {
        return (
            <AssayDesignerPanels
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
            editableRuns: true,
            editableResults: true,
            domains: [{
                name: 'Run Properties',
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
            },{
                name: 'Results Properties',
                fields: [{
                    name: 'Name',
                    rangeURI: 'xsd:string'
                },{
                    name: 'Index',
                    rangeURI: 'xsd:int'
                },{
                    name: 'Date',
                    rangeURI: 'xsd:dateTime'
                },{
                    name: 'Location',
                    rangeURI: 'xsd:string'
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