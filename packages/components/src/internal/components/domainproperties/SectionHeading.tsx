/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode } from 'react';

import { LabelHelpTip } from '../base/LabelHelpTip';

interface Props {
    cls?: string;
    helpTipBody?: ReactNode;
    id?: string;
    title: string;
}

export const SectionHeading: FC<Props> = memo(props => (
    <h3 className={'domain-field-section-heading' + (props.cls ? ' ' + props.cls : '')} id={props.id}>
        {props.title}
        {props.helpTipBody && <LabelHelpTip title={props.title}>{props.helpTipBody}</LabelHelpTip>}
    </h3>
));

SectionHeading.displayName = 'SectionHeading';
