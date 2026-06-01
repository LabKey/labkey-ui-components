/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PropsWithChildren, useMemo } from 'react';

import { OverlayTrigger, TriggerType } from '../../OverlayTrigger';
import { Tooltip } from '../../Tooltip';
import { generateId } from '../../util/utils';

interface Props extends PropsWithChildren {
    caption: React.ReactNode;
    triggerType?: TriggerType;
}

export const Tip: FC<Props> = ({ caption, children, triggerType }) => {
    const id = useMemo(() => generateId('tip-'), []);
    return (
        <OverlayTrigger
            delay={200}
            id={id}
            overlay={
                <Tooltip id={id} placement="top">
                    {caption}
                </Tooltip>
            }
            triggerType={triggerType}
        >
            {children}
        </OverlayTrigger>
    );
};
Tip.displayName = 'Tip';
