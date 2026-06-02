/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PropsWithChildren, ReactNode, useMemo } from 'react';

import { DropdownButton } from '../../dropdowns';

interface Props extends PropsWithChildren {
    children: ReactNode;
    disabled?: boolean;
    pullRight?: boolean;
    showIcon?: boolean;
}

export const ManageDropdownButton: FC<Props> = ({ children, disabled, showIcon = true, pullRight = true }) => {
    const buttonLabel: ReactNode = useMemo(
        () => (
            <span>
                {showIcon && <i className="fa fa-bars margin-right" />}
                Manage
            </span>
        ),
        [showIcon]
    );

    return (
        <DropdownButton
            buttonClassName="manage-dropdown"
            className="manage-dropdown-menu"
            disabled={disabled}
            noCaret
            pullRight={pullRight}
            title={buttonLabel}
        >
            {children}
        </DropdownButton>
    );
};
ManageDropdownButton.displayName = 'ManageDropdownButton';
