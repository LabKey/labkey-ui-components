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

import { Draft, immerable, produce } from "immer";

import { User } from "../base/models/User"; // do not refactor to '../..', cause jest test to failure with typescript constructor error due to circular class loading
import { generateId } from "../../util/utils"; // // do not refactor to '../..', cause jest test to failure with typescript constructor error due to circular class loading

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


export class ServerActivityData {
    [immerable] = true;

    readonly RowId: number;
    readonly Type: string;
    readonly Created: string;
    readonly CreatedBy: string;
    readonly UserId: number;
    readonly ObjectId: string;
    readonly ReadOn: string;
    readonly ActionLinkText: string;
    readonly ActionLinkUrl: string;
    readonly ContainerId: string;
    readonly HtmlContent: string;
    readonly Content: string;
    readonly ContentType: string;
    readonly IconCls: string;
    readonly inProgress: boolean;
    readonly hasError: boolean;

    constructor(values?: Partial<ServerActivityData>) {
        const addedValues = {};
        if (values.Type?.indexOf('error') >= 0) {
            Object.assign(addedValues, { hasError: true });
        }
        Object.assign(this, values, addedValues);
    }

    mutate(props: Partial<ServerActivityData>): ServerActivityData {
        return produce(this, (draft: Draft<ServerActivityData>) => {
            Object.assign(draft, props);
        });
    }

    isUnread(): boolean {
        return this.ReadOn == undefined;
    }

    isHTML(): boolean {
        return this.ContentType?.toLowerCase() === 'text/html';
    }
}

export interface ServerActivity {
    data: ServerActivityData[];
    totalRows: number;
    unreadCount: number;
    inProgressCount: number;
}

export interface ServerNotificationsConfig {
    maxRows: number;
    markAllNotificationsRead: () => Promise<boolean>;
    serverActivity: ServerNotificationModel;
    onViewAll: () => any;
    onShowErrorDetail: (notification: ServerActivityData) => any;
    onRead?: () => any;
}

export interface IServerNotificationModel
{
    data: ServerActivityData[];
    totalRows: number;
    unreadCount: number;
    inProgressCount: number;

    isError: boolean;
    isLoaded: boolean;
    isLoading: boolean;
    errorMessage: string;
}

const DEFAULT_SERVER_NOTIFICATION_MODEL : IServerNotificationModel = {
    data: undefined,
    totalRows: 0,
    unreadCount: 0,
    inProgressCount: 0,

    isError: false,
    isLoaded: false,
    isLoading: false,
    errorMessage: undefined
};

export class ServerNotificationModel implements IServerNotificationModel {
    [immerable] = true;

    readonly data: ServerActivityData[];
    readonly totalRows: number;
    readonly unreadCount: number;
    readonly inProgressCount: number;

    readonly isError: boolean;
    readonly isLoaded: boolean;
    readonly isLoading: boolean;
    readonly errorMessage: string;

    constructor(values?: Partial<ServerNotificationModel>) {
        Object.assign(this, DEFAULT_SERVER_NOTIFICATION_MODEL, values);
    }

    mutate(props: Partial<ServerNotificationModel>): ServerNotificationModel {
        return produce(this, (draft: Draft<ServerNotificationModel>) => {
            Object.assign(draft, props);
        });
    }

    setLoadingStart() {
        return this.mutate({isLoading: true, isLoaded: false, isError: false, errorMessage: undefined})
    }

    setLoadingComplete(result: Partial<ServerNotificationModel>) {
        return this
            .mutate({isLoading: false, isLoaded: true, isError: false, errorMessage: undefined})
            .mutate(result);
    }

    setError(errorMessage: string) {
        return this
            .mutate({isLoading: false, isLoaded: true, isError: true, errorMessage: errorMessage});
    }

}
