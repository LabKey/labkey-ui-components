/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PropsWithChildren, useMemo } from 'react';

import { generateId } from '../util/utils';
import { Placement } from '../useOverlayPositioning';
import { Popover } from '../Popover';
import { OverlayTrigger } from '../OverlayTrigger';

interface Props extends PropsWithChildren {
    placement?: Placement;
}

export const HelpIcon: FC<Props> = memo(({ children, placement = 'bottom' }) => {
    const id = useMemo(() => generateId(), []);
    const overlayContent = (
        <Popover id={id} placement={placement}>
            {children}
        </Popover>
    );
    return (
        <span className="help-icon">
            <OverlayTrigger overlay={overlayContent}>
                <i className="fa fa-question-circle" />
            </OverlayTrigger>
        </span>
    );
});
HelpIcon.displayName = 'HelpIcon';
