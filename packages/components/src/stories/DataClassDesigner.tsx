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

import { DataClassDesigner } from '../internal/components/domainproperties/dataclasses/DataClassDesigner';
import { DataClassModel } from '../internal/components/domainproperties/dataclasses/models';
import getDomainDetailsJSON from '../test/data/dataclass-getDomainDetails.json';
import './stories.scss';
import { IDomainField } from '..';

const DEFAULT_NAME_FIELD_CONFIG = {
    name: 'SourceId',
} as Partial<IDomainField>;

storiesOf('DataClassDesigner', module)
    .addDecorator(withKnobs)
    .add('for create', () => {
        return (
            <DataClassDesigner
                onCancel={() => console.log('cancel')}
                onComplete={model => console.log('complete', model)}
                initModel={DataClassModel.create({})}
                nounSingular={text('nounSingular', undefined)}
                nounPlural={text('nounPlural', undefined)}
                appPropertiesOnly={boolean('appPropertiesOnly', false)}
                headerText={text('headerText', undefined)}
                nameExpressionInfoUrl={text('nameExpressionInfoUrl', undefined)}
                nameExpressionPlaceholder={text('nameExpressionPlaceholder', undefined)}
                successBsStyle={text('successBsStyle', 'success')}
            />
        );
    })
    .add('for update', () => {
        return (
            <DataClassDesigner
                onCancel={() => console.log('cancel')}
                onComplete={model => console.log('complete', model)}
                initModel={DataClassModel.create(getDomainDetailsJSON)}
                defaultNameFieldConfig={DEFAULT_NAME_FIELD_CONFIG}
                nounSingular={text('nounSingular', 'Source')}
                nounPlural={text('nounPlural', 'Sources')}
                appPropertiesOnly={boolean('appPropertiesOnly', true)}
                headerText={text(
                    'headerText',
                    'Use source types to connect your samples to their biological or physical origins.'
                )}
                nameExpressionInfoUrl={text('nameExpressionInfoUrl', 'https://www.labkey.org/Documentation')}
                nameExpressionPlaceholder={text(
                    'nameExpressionPlaceholder',
                    'Enter your source type naming pattern here...'
                )}
                successBsStyle={text('successBsStyle', 'success')}
            />
        );
    });
