/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';
import { Map } from 'immutable';

import { ColorIcon } from '../components/base/ColorIcon';
import { caseInsensitive } from '../util/utils';

export const SAMPLE_COLOR_COLUMN_NAME = 'SampleColor';
export const SAMPLE_COLOR_COLOR_COLUMN_NAME = 'SampleColor/Color';

interface Props {
    data?: Map<any, any>;
    row?: Map<any, any>;
}

export const SampleColorRenderer: FC<Props> = memo(({ data, row }) => {
    const label = data?.get('displayValue') ?? data?.get('value');
    if (label === undefined || label === null || label === '') return null;

    let color: string;
    if (row) {
        const rowJS = row.toJS();
        color =
            caseInsensitive(rowJS, SAMPLE_COLOR_COLOR_COLUMN_NAME)?.value ??
            caseInsensitive(rowJS, 'SampleID/' + SAMPLE_COLOR_COLOR_COLUMN_NAME)?.value;
    }

    return <ColorIcon useSmall value={color} label={label} />;
});

SampleColorRenderer.displayName = 'SampleColorRenderer';
