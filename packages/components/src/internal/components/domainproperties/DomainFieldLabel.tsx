/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode } from 'react';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { getSplitSentence } from './actions';

export interface DomainFieldLabelProps {
    helpTipBody?: ReactNode;
    id?: string;
    label: string;
    required?: boolean;
}

export const DomainFieldLabel: FC<DomainFieldLabelProps> = memo(props => (
    <span id={props.id}>
        {getSplitSentence(props.label, false)}
        <span className="domain-no-wrap">
            {getSplitSentence(props.label, true)}
            {props.helpTipBody && (
                <LabelHelpTip title={props.label} required={props.required}>
                    {props.helpTipBody}
                </LabelHelpTip>
            )}
            {props.required ? ' *' : ''}
        </span>
    </span>
));

DomainFieldLabel.displayName = 'DomainFieldLabel';
