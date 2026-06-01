/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';

import { LabelHelpTip } from '../base/LabelHelpTip';
import { DomainFieldError } from './models';

interface Props {
    fieldError: DomainFieldError;
}

export const DomainRowWarning: FC<Props> = memo(({ fieldError }) => {
    const { extraInfo, message, severity } = fieldError;
    const msg = severity + ': ' + message;
    const icon = <span className="fa fa-exclamation-circle domain-warning-icon" />;

    return (
        <span className="domain-row-warning">
            {extraInfo && (
                <LabelHelpTip iconComponent={icon} title={severity}>
                    {extraInfo}
                </LabelHelpTip>
            )}
            {extraInfo && <span>&nbsp;</span>}
            {msg}
        </span>
    );
});
DomainRowWarning.displayName = 'DomainRowWarning';
