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
import { List } from 'immutable';

import { Grid, GridColumn } from '../../..';

import { DomainDesign } from './models';

export const DOMAIN_FIELD_COLS = List([
    new GridColumn({
        index: 'name',
        title: 'Name',
    }),
    new GridColumn({
        index: 'label',
        title: 'Label',
    }),
    new GridColumn({
        index: 'rangeURI',
        title: 'Range URI',
    }),
    new GridColumn({
        index: 'conceptURI',
        title: 'Concept URI',
    }),
    new GridColumn({
        index: 'required',
        title: 'Required',
    }),
    new GridColumn({
        index: 'scale',
        title: 'Scale',
    }),
]);

type Props = {
    domain: DomainDesign;
    title?: string;
};

export class DomainFieldsDisplay extends React.Component<Props, any> {
    render() {
        const { domain, title } = this.props;
        const { name, description, fields } = domain;

        return (
            <Panel>
                <Panel.Heading>
                    <div className="panel-title">{title || name}</div>
                </Panel.Heading>
                <Panel.Body>
                    <p>{description}</p>
                    <Grid columns={DOMAIN_FIELD_COLS} data={fields} />
                </Panel.Body>
            </Panel>
        );
    }
}
