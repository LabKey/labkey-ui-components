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
import { Panel } from 'react-bootstrap';
import { storiesOf } from '@storybook/react';
import { text, withKnobs } from '@storybook/addon-knobs';

import { LineageGraph } from '../components/lineage/LineageGraph';
import { LineageGrid } from '../components/lineage/LineageGrid';
import { LineageFilter, LINEAGE_GROUPING_GENERATIONS, LINEAGE_DIRECTIONS } from '../components/lineage/types';

import './stories.scss';
import { fromJS } from 'immutable';

storiesOf('Lineage', module)
    .addDecorator(withKnobs)
    .add('LineageGraph', () => {
        return (
            <LineageGraph
                lsid="urn:lsid:labkey.com:Sample.61.Hemoglobin:Hgb3.3"
                grouping={{ generations: LINEAGE_GROUPING_GENERATIONS.Specific }}
                filters={[new LineageFilter('type', ['Sample', 'Data'])]}
                groupTitles={fromJS({[LINEAGE_DIRECTIONS.Parent]: {hemoglobin: text('Hemoglobin parent suffix', 'Parents')}})}
            />
        );
    })
    .add('LineageGrid', () => {
        return (
            <Panel>
                <Panel.Body>
                    <LineageGrid lsid="urn:lsid:labkey.com:Sample.61.Hemoglobin:Hgb3.3" />
                </Panel.Body>
            </Panel>
        );
    });
