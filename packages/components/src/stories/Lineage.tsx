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
import { fromJS, Map } from 'immutable';
import { Panel } from 'react-bootstrap';
import { storiesOf } from '@storybook/react';
import { text, withKnobs } from '@storybook/addon-knobs';

import { LineageGraph } from '../internal/components/lineage/LineageGraph';
import { LineageGrid, LineageGridFromLocation } from '../internal/components/lineage/grid/LineageGrid';
import { LineageFilter, LINEAGE_DIRECTIONS, LINEAGE_GROUPING_GENERATIONS } from '../internal/components/lineage/types';

import './stories.scss';

storiesOf('Lineage', module)
    .addDecorator(withKnobs)
    .add('LineageGraph', () => {
        return (
            <LineageGraph
                lsid="urn:lsid:labkey.com:Sample.61.Hemoglobin:Hgb3.3"
                grouping={{ generations: LINEAGE_GROUPING_GENERATIONS.Specific }}
                filters={[new LineageFilter('type', ['Sample', 'Data'])]}
                groupTitles={fromJS({
                    [LINEAGE_DIRECTIONS.Parent]: { hemoglobin: text('Hemoglobin parent suffix', 'Parents') },
                })}
            />
        );
    })
    .add('LineageGraph (Runs)', () => {
        return (
            <LineageGraph
                lsid="urn:lsid:labkey.com:GeneralAssayRun.Folder-6:a8502172-5c05-1038-bd26-eb04885eb6a6"
                grouping={{ generations: LINEAGE_GROUPING_GENERATIONS.Specific }}
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
    })
    .add('LineageGridFromLocation', () => {
        const location = {
            query: Map({
                seeds: 'urn:lsid:labkey.com:Sample.61.Hemoglobin:Hgb3.3',
            }),
        };

        return (
            <Panel>
                <Panel.Body>
                    <LineageGridFromLocation location={location} />
                </Panel.Body>
            </Panel>
        );
    });
