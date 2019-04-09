/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Record } from 'immutable'
import { User } from "@glass/models";
import { generateId } from '../../utils/utils'


export type MessageFunction<T> = (props?: T, user?: User, data?: any) => React.ReactNode;

export const enum Persistence {
    PAGE_LOAD,
    LOGIN_SESSION,
}

export interface NotificationItemProps {
    alertClass?: string
    data?: any
    id?: string
    isDismissible?: boolean
    isDismissed?: boolean
    message: string | MessageFunction<NotificationItemProps>
    onDismiss?: () => any
    persistence?: Persistence
}

export class NotificationItemModel extends Record({
    alertClass: 'success',
    data: undefined,
    id: undefined,
    isDismissible: true,
    isDismissed: false,
    message: undefined,
    onDismiss: undefined,
    persistence: Persistence.PAGE_LOAD
}) implements NotificationItemProps {
    alertClass: string;
    data?: any;
    id: string;
    isDismissible: boolean;
    isDismissed: boolean;
    message: string | MessageFunction<NotificationItemProps>;
    onDismiss?: () => any;
    persistence?: Persistence;

    static create(values?: {[key:string]: any}) {
        return new NotificationItemModel(Object.assign({}, {
            id: nextNotificationId()
        }, values));
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

function nextNotificationId(): string {
    return generateId('notification_');
}



