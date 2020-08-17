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
import React from 'react';
import { Record } from 'immutable';

import { generateId } from '../../util/utils';
import { User } from '../base/models/model';

export type MessageFunction<T> = (props?: T, user?: User, data?: any) => React.ReactNode;

export const enum Persistence {
    PAGE_LOAD,
    LOGIN_SESSION,
}

// This interface is available so you do not have .create a Model object and so the id can be optionally
// created for you.
export interface NotificationItemProps {
    alertClass?: string;
    data?: any;
    id?: string;
    isDismissible?: boolean;
    isDismissed?: boolean;
    message: string | MessageFunction<NotificationItemProps>;
    onDismiss?: () => any;
    persistence?: Persistence;
}

export class NotificationItemModel
    extends Record({
        alertClass: 'success',
        data: undefined,
        id: undefined,
        isDismissible: true,
        isDismissed: false,
        message: undefined,
        onDismiss: undefined,
        persistence: Persistence.PAGE_LOAD,
    })
    implements NotificationItemProps {
    alertClass: string;
    data?: any;
    id: string;
    isDismissible: boolean;
    isDismissed: boolean;
    message: string | MessageFunction<NotificationItemProps>;
    onDismiss?: () => any;
    persistence?: Persistence;

    static create(values?: NotificationItemProps): NotificationItemModel {
        return new NotificationItemModel(
            Object.assign(
                {},
                {
                    id: nextNotificationId(),
                },
                values
            )
        );
    }
}

function nextNotificationId(): string {
    return generateId('notification_');
}
