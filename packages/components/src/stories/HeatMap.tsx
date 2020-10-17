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
import { text, withKnobs } from '@storybook/addon-knobs';

import { AppURL, HeatMap, SCHEMAS } from '..';
import './stories.scss';

storiesOf('HeatMap', module)
    .addDecorator(withKnobs)
    .add('samples with data', () => {
        return (
            <HeatMap
                schemaQuery={SCHEMAS.EXP_TABLES.SAMPLE_SET_HEAT_MAP}
                nounSingular="sample"
                nounPlural="samples"
                yAxis="protocolName"
                xAxis="monthName"
                measure="monthTotal"
                yInRangeTotal="InRangeTotal"
                yTotalLabel={text('yTotalLabel', '12 month total samples')}
                getCellUrl={row => AppURL.create('samples', row.getIn(['Protocol', 'displayValue']).toLowerCase())}
                getHeaderUrl={cell => cell.get('url')}
                getTotalUrl={cell => cell.get('url')}
                headerClickUrl={AppURL.create('q', 'exp', 'materials')}
                navigate={url => console.log(url.toString())}
            />
        );
    })
    .add('assays with data', () => {
        return (
            <HeatMap
                schemaQuery={SCHEMAS.EXP_TABLES.ASSAY_HEAT_MAP}
                nounSingular="run"
                nounPlural="runs"
                yAxis="protocolName"
                xAxis="monthName"
                measure="monthTotal"
                yInRangeTotal="InRangeTotal"
                yTotalLabel={text('yTotalLabel', '12 month total runs')}
                getCellUrl={row =>
                    AppURL.create(
                        'assays',
                        row.getIn(['Provider', 'value']),
                        row.getIn(['Protocol', 'displayValue']),
                        'runs'
                    )
                }
                getHeaderUrl={cell => {
                    const provider = cell.get('providerName');
                    const protocol = cell.get('protocolName');
                    return AppURL.create('assays', provider, protocol, 'overview');
                }}
                getTotalUrl={cell => {
                    const provider = cell.get('providerName');
                    const protocol = cell.get('protocolName');
                    return AppURL.create('assays', provider, protocol, 'runs');
                }}
                headerClickUrl={AppURL.create('q', 'exp', 'assayruns')}
                navigate={url => console.log(url.toString())}
            />
        );
    });
