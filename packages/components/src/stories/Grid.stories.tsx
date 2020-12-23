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
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import * as constants from './constants';

import './stories.scss';
import { Grid } from '..';

storiesOf('Grid', module)
    .addDecorator(withKnobs)
    .add('With basic data', () => <Grid data={constants.gridData} />, {
        notes: constants.gridWithBasicDataMD,
    })
    .add('With columns', () => <Grid data={constants.gridData} columns={constants.gridColumns} />, {
        notes: constants.gridWithColumnsMD,
    })
    .add('With knobs', () => (
        <Grid
            bordered={boolean('bordered', true)}
            condensed={boolean('condensed', false)}
            emptyText={text('emptyText', 'No data available')}
            responsive={boolean('responsive', true)}
            showHeader={boolean('showHeader', true)}
            striped={boolean('striped', true)}
            transpose={boolean('transpose', false)}
            data={constants.gridData}
            columns={constants.gridColumns}
        />
    ))
    .add('With messages', () => <Grid data={constants.gridData} messages={constants.gridMessages} />);
