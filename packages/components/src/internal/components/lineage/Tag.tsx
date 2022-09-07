/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { List, Map } from 'immutable';
import { Button } from 'react-bootstrap';

import { GridColumn } from '../base/models/GridColumn';

import { AppURL } from '../../url/AppURL';

import { DEFAULT_LINEAGE_DISTANCE } from './constants';
import { LINEAGE_DIRECTIONS } from './types';

interface TagProps {
    bsStyle?: string;
    showOnHover?: boolean;
}

export const Tag: React.FunctionComponent<TagProps> = props => (
    <span className={'pull-right ' + (props.showOnHover === false ? 'hide-on-hover' : 'show-on-hover')}>
        <span className={'label ' + (props.bsStyle ? `label-${props.bsStyle}` : '')}>{props.children}</span>
    </span>
);

