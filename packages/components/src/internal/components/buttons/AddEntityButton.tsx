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
import React, { FC, memo } from 'react';

import { ActionButton, ActionButtonProps } from './ActionButton';

export interface AddEntityButtonProps extends ActionButtonProps {
    entity: string;
}

export const AddEntityButton: FC<AddEntityButtonProps> = memo(({ entity, ...actionButtonProps}) => {
    return (
        <ActionButton {...actionButtonProps}>
            <i className="fa fa-plus-circle container--addition-icon" /> Add {entity}
        </ActionButton>
    );
});

AddEntityButton.displayName = 'AddEntityButton';
