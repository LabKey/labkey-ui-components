/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode, FC, memo } from 'react';

import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { Placement } from '../../useOverlayPositioning';

interface Props {
    body: ReactNode;
    className?: string;
    iconCls?: string;
    id: string;
    placement?: Placement;
    title: string;
}

export const LockIcon: FC<Props> = memo(({ id, title, iconCls, body, className, placement = 'bottom' }) => (
    <OverlayTrigger
        className={className}
        overlay={
            <Popover id={id} title={title} placement={placement}>
                {body}
            </Popover>
        }
    >
        <span className={'domain-field-lock-icon' + (iconCls ? ' ' + iconCls : '')}>
            <span className="fa fa-lock" />
        </span>
    </OverlayTrigger>
));
LockIcon.displayName = 'LockIcon';
