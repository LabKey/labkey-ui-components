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
import { ActionURL, Ajax, Filter, getServerContext, Utils } from '@labkey/api';

import { ServerActivity, ServerActivityData } from './model';
import {buildURL} from "../../url/AppURL";
import {resolveErrorMessage} from "../../util/messaging";
import {selectRowsDeprecated} from "../../query/api";

/**
 * Used to notify the server that the trial banner has been dismissed
 */
export function setTrialBannerDismissSessionKey(): Promise<any> {
    return new Promise(() => {
        Ajax.request({
            url: buildURL('core', 'dismissWarnings.api'),
            method: 'POST',
        });
    });
}

export function getServerNotifications(typeLabels?: string[], maxRows?: number): Promise<ServerActivity> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('notification', 'getUserNotifications.api'),
            method: 'GET',
            params: { container: getServerContext().container.id, typeLabels, maxRows },
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    const notifications = response.notifications.map(
                        notification => new ServerActivityData(notification)
                    );
                    resolve({
                        data: notifications,
                        totalRows: response.totalRows,
                        unreadCount: response.unreadCount,
                        inProgressCount: 0,
                    });
                } else {
                    console.error(response);
                    reject('There was a problem retrieving your notification data.');
                }
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(resolveErrorMessage(response));
            }),
        });
    });
}

export function getRunningPipelineJobStatuses(filters?: Filter.IFilter[]): Promise<ServerActivity> {
    const statusFilter = Filter.create('Status', ['RUNNING', 'WAITING', 'SPLITWAITING'], Filter.Types.IN);
    return new Promise((resolve, reject) => {
        selectRowsDeprecated({
            schemaName: 'pipeline',
            queryName: 'job',
            filterArray: [statusFilter].concat(filters ?? []),
            sort: 'Created',
        })
            .then(response => {
                const model = response.models[response.key];
                const activities = [];
                Object.values(model).forEach(row => {
                    activities.push(
                        new ServerActivityData({
                            inProgress: true,
                            Content: row['Description']['value'],
                            ContentType: 'text/plain',
                            Created: row['Created']['formattedValue'],
                            CreatedBy: row['CreatedBy']['displayValue'],
                        })
                    );
                });
                resolve({
                    data: activities,
                    totalRows: response.totalRows,
                    unreadCount: 0, // these are always considered to be read since they aren't actually notifications
                    inProgressCount: response.totalRows,
                });
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

export function getPipelineActivityData(maxRows?: number, filters?: Filter.IFilter[]): Promise<ServerActivity> {
    return new Promise((resolve, reject) => {
        Promise.all([getServerNotifications(['Pipeline'], maxRows), getRunningPipelineJobStatuses(filters)])
            .then(responses => {
                const [notifications, statuses] = responses;

                resolve({
                    data: statuses.data.concat(...notifications.data).slice(0, maxRows),
                    totalRows: notifications.totalRows + statuses.totalRows,
                    unreadCount: notifications.unreadCount,
                    inProgressCount: statuses.inProgressCount,
                });
            })
            .catch(reason => {
                console.error(reason);
                reject('There was a problem retrieving your notification data.  Try refreshing the page.');
            });
    });
}

export function markNotificationsAsRead(rowIds: number[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('notification', 'markNotificationAsRead.api'),
            method: 'POST',
            jsonData: { rowIds },
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    resolve(true);
                } else {
                    console.error(response);
                    resolve(false);
                }
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(false);
            }),
        });
    });
}

export function markAllNotificationsAsRead(typeLabels: string[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('notification', 'markAllNotificationAsRead.api'),
            method: 'POST',
            jsonData: { container: getServerContext().container.id, typeLabels },
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    resolve(true);
                } else {
                    console.error(response);
                    resolve(false);
                }
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(false);
            }),
        });
    });
}
