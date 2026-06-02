/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PropsWithChildren, ReactNode } from 'react';
import classNames from 'classnames';

interface ContentGroupLabelProps extends PropsWithChildren {
    withoutBottomMargin?: boolean;
}

export const ContentGroupLabel: FC<ContentGroupLabelProps> = ({ withoutBottomMargin, children }) => {
    return (
        <div className={classNames('content-group-label', { 'content-group': !withoutBottomMargin })}>{children}</div>
    );
};
ContentGroupLabel.displayName = 'ContentGroupLabel';

interface ContentGroupProps extends PropsWithChildren {
    label?: ReactNode;
}

export const ContentGroup: FC<ContentGroupProps> = ({ children, label }) => {
    return (
        <div className="content-group">
            {label && <ContentGroupLabel>{label}</ContentGroupLabel>}
            {children}
        </div>
    );
};
ContentGroup.displayName = 'ContentGroup';
