/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';
import { Map } from 'immutable';

import { UserLink } from '../components/user/UserLink';
import { getDataStyling } from '../util/utils';
import { isConditionalFormattingEnabled } from '../app/utils';
import { useServerContext } from '../components/base/ServerContext';

interface Props {
    data: Map<any, any>;
}

export const UserDetailsRenderer: FC<Props> = memo(({ data }) => {
    const { moduleContext } = useServerContext();
    if (!data) return null;

    const { displayValue, value } = data.toJS();
    const style = isConditionalFormattingEnabled(moduleContext) ? getDataStyling(data) : undefined;
    const className = style?.backgroundColor && displayValue ? 'status-pill' : undefined;

    return (
        <span className={className} style={style}>
            <UserLink userId={value} userDisplayValue={displayValue} />
        </span>
    );
});
