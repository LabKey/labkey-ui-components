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
import { text, boolean, withKnobs } from '@storybook/addon-knobs';
import { DataClassDesigner } from "../components/domainproperties/dataclasses/DataClassDesigner";
import { DataClassModel } from "../components/domainproperties/dataclasses/models";
import './stories.scss';

storiesOf('DataClassDesigner', module)
    .addDecorator(withKnobs)
    .add('DataClassDesignerPanels - create', () => {
        return <DataClassDesigner
            onCancel={() => console.log('cancel')}
            onComplete={(model) => console.log('complete', model.toJS())}
            initModel={DataClassModel.create({})}
            noun={text('noun', undefined)}
            appPropertiesOnly={boolean('appPropertiesOnly', false)}
            headerText={text('headerText', undefined)}
            nameExpressionInfoUrl={text('nameExpressionInfoUrl', undefined)}
            nameExpressionPlaceholder={text('nameExpressionPlaceholder', undefined)}
            successBsStyle={text('successBsStyle', 'success')}
        />
    })
    .add('DataClassDesignerPanels - update', () => {
        return <DataClassDesigner
            onCancel={() => console.log('cancel')}
            onComplete={(model) => console.log('complete', model.toJS())}
            initModel={DataClassModel.create({rowId: 1, name: 'testing1', description: 'testing2', nameExpression: 'DC-${genId}', materialSourceId: 111})}
            noun={text('noun', 'Source')}
            appPropertiesOnly={boolean('appPropertiesOnly', true)}
            headerText={text('headerText', 'Use source types to connect your samples to their biological or physical origins.')}
            nameExpressionInfoUrl={text('nameExpressionInfoUrl', 'https://www.labkey.org/Documentation')}
            nameExpressionPlaceholder={text('nameExpressionPlaceholder', 'Enter your source type naming patter here...')}
            successBsStyle={text('successBsStyle', 'success')}
        />
    });
