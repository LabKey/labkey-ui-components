/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { forwardRef } from 'react';

interface IconProps {
    iconClass: string;
    srText: string; // text for screen readers
}
export const Icon = forwardRef<HTMLSpanElement, IconProps>(({ iconClass, srText }, ref) => {
    return (
        <span ref={ref}>
            <span aria-hidden="true" className={iconClass} />
            <span className="sr-only">{srText}</span>
        </span>
    );
});
Icon.displayName = 'Icon';
