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

export const ManageDropdownButton: FC = props => {
    const { children } = props;
    const buttonLabel: ReactNode = useMemo(
        () => (
            <span>
                <i className="fa fa-bars" /> Manage
            </span>
        ),
        []
    );

    return (
        <DropdownButton title={buttonLabel} noCaret pullRight>
            {children}
        </DropdownButton>
    );
};
ManageDropdownButton.displayName = 'ManageDropdownButton';
