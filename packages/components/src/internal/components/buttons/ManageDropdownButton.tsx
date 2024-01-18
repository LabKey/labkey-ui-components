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
import React, { FC, ReactNode } from 'react';

import { DropdownButton } from '../../dropdowns';

interface Props {
    className?: string;
    collapsed?: boolean;
    disabled?: boolean;
    pullRight?: boolean;
    title?: string;
}

export const ManageDropdownButton: FC<Props> = props => {
    const { children, className, collapsed = false, disabled = false, pullRight = false, title = 'Manage' } = props;
    let buttonLabel: ReactNode = title;
    let noCaret = false;

    if (collapsed) {
        buttonLabel = (
            <span>
                <i className="fa fa-bars" /> Manage
            </span>
        );
        noCaret = true;
    }

    return (
        <DropdownButton
            disabled={disabled}
            title={buttonLabel}
            noCaret={noCaret}
            pullRight={pullRight}
            className={className}
        >
            {children}
        </DropdownButton>
    );
};
