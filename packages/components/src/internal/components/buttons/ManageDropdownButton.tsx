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
import React, { FC, ReactNode, useMemo } from 'react';

import { DropdownButton } from '../../dropdowns';

export const ManageDropdownButton: FC<{
    children: React.ReactNode;
    disabled?: boolean;
    showIcon?: boolean;
}> = props => {
    const { children, disabled, showIcon = true } = props;
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
        <DropdownButton title={buttonLabel} noCaret pullRight disabled={disabled}>
            {children}
        </DropdownButton>
    );
};
ManageDropdownButton.displayName = 'ManageDropdownButton';
