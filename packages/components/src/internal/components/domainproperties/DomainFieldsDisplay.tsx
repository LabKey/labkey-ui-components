/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC } from 'react';
import { List } from 'immutable';

import { GridColumn } from '../base/models/GridColumn';
import { Grid } from '../base/Grid';

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

export const DomainFieldsDisplay: FC<Props> = ({ domain, title }) => (
    <div className="panel panel-default">
        <h2 className="panel-heading">
            <div className="panel-title">{title || domain.name}</div>
        </h2>
        <div className="panel-body">
            <p>{domain.description}</p>
            <Grid columns={DOMAIN_FIELD_COLS} data={domain.fields} />
        </div>
    </div>
);
DomainFieldsDisplay.displayName = 'DomainFieldsDisplay';
