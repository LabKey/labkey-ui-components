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
import { Map } from 'immutable';
import { storiesOf } from '@storybook/react';
import { text, withKnobs } from '@storybook/addon-knobs';
import { SampleSetDetailsPanel } from '../components/samples/SampleSetDetailsPanel';
import domainData from '../test/data/property-getDomain-sampleType.json';

import './stories.scss';
import {DomainDetails} from "../components/domainproperties/models";
import {Domain} from "@labkey/api";
import {SampleTypeDesigner} from "../components/domainproperties/samples/SampleTypeDesigner";
import {SampleTypeModel} from "../components/domainproperties/samples/models";

storiesOf('SampleTypeDesigner', module)
    .addDecorator(withKnobs)
    .add('for create', () => {
        return <SampleTypeDesigner
            initModel={SampleTypeModel.create({})}
            onCancel={() => console.log('Cancel clicked')}
            onComplete={() => console.log('Create clicked')}
            nameExpressionInfoUrl={text('nameExpressionInfoUrl', 'https://wwDodomw.labkey.org')}
            nameExpressionPlaceholder={text('nameExpressionPlaceholder', undefined)}
        />
    });
    // .add('for update', () => {
    //     let design = DomainDetails.create(Map(domainData), Domain.KINDS.SAMPLE_TYPE);
    //
    //     return <SampleSetDetailsPanel
    //         data={ design }
    //         onCancel={() => console.log('Cancel clicked')}
    //         onComplete={() => console.log('Create clicked')}
    //         nameExpressionInfoUrl={text('nameExpressionInfoUrl', undefined)}
    //         nameExpressionPlaceholder={text('nameExpressionPlaceholder', undefined)}
    //     />
    // });
