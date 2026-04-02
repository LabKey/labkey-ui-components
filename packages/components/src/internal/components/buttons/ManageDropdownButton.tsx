/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
