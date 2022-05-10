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
import React, { FC, useCallback } from 'react';

import { useServerContext } from '../../..';

import { NotificationItemModel } from './model';
import { dismissNotifications } from './global';

interface ItemProps {
    item: NotificationItemModel;
}

export const NotificationItem: FC<ItemProps> = ({ item }) => {
    const { user } = useServerContext();
    const { data, id, message, isDismissible } = item;
    const onClick = useCallback(() => dismissNotifications(id), [id]);

    return (
        <div className="notification-item">
            {typeof message === 'function' ? message(item, user, data) : message}
            {isDismissible && <i style={{ float: 'right' }} className="fa fa-times-circle pointer" onClick={onClick} />}
        </div>
    );
};
