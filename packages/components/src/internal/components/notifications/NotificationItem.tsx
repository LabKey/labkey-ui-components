/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
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
