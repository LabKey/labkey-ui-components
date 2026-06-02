/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PropsWithChildren } from 'react';
import classNames from 'classnames';

interface Props extends PropsWithChildren {
    className?: string;
    expanded: boolean;
}

export const Collapsible: FC<Props> = memo(({ children, className, expanded }) => (
    <div className={classNames('collapse', className, { in: expanded })}>{children}</div>
));
Collapsible.displayName = 'Collapsible';
