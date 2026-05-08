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

import { NotificationItemModel } from './model';
import { useNotificationsContext } from './NotificationsContext';
import { useEnterEscape } from '../../../public/useEnterEscape';

interface ItemProps {
    item: NotificationItemModel;
}

export const NotificationItem: FC<ItemProps> = ({ item }) => {
    const { dismissNotifications } = useNotificationsContext();
    const { data, id, message, isDismissible } = item;
    const onClick = useCallback(() => dismissNotifications(id), [dismissNotifications, id]);
    const onKeyDown = useEnterEscape(onClick);

    return (
        <div className="notification-item">
            {typeof message === 'function' ? message(item, data) : message}
            {isDismissible && (
                <i
                    className="fa fa-times-circle pointer"
                    onClick={onClick}
                    onKeyDown={onKeyDown}
                    style={{ float: 'right' }}
                    tabIndex={0}
                />
            )}
        </div>
    );
};
NotificationItem.displayName = 'NotificationItem';
