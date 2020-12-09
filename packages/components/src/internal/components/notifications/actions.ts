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
import { ActionURL, Ajax, Utils } from '@labkey/api';

import { buildURL, naturalSortByProperty, resolveErrorMessage } from '../../..';

import { NotificationItemModel, NotificationItemProps, ServerActivityData } from './model';
import { addNotification } from './global';

export type NotificationCreatable = string | NotificationItemProps | NotificationItemModel;

/**
 * Create a notification that can be displayed on pages within the application
 * @param creatable
 * @param notify - Function that handles display of the notification. Default is global.addNotification as used in SampleManagement
 */
export function createNotification(creatable: NotificationCreatable) {
    let item: NotificationItemModel;
    if (Utils.isString(creatable)) {
        item = NotificationItemModel.create({
            message: creatable,
        });
    } else if (!(creatable instanceof NotificationItemModel)) {
        item = NotificationItemModel.create(creatable as NotificationItemProps);
    } else item = creatable;

    if (item) addNotification(item);
}

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

export function getServerNotifications(groups?: string[]): Promise<ServerActivityData[]> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('notification', 'getUserNotificationsForPanel.api'),
            method: 'GET',
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    const notifications = [];
                    Object.keys(response.notifications.grouping).forEach(grouping => {
                        if (!groups || groups.indexOf(grouping) >= 0) {
                            response.notifications.grouping[grouping].forEach(id => {
                                notifications.push(new ServerActivityData(response.notifications[id]));
                            });
                        }
                    });
                    resolve(notifications);
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

export function getPipelineJobStatuses(): Promise<ServerActivityData[]> {
    // TODO
    return new Promise((resolve, reject) => {
        resolve([]);
    });
}

export function getPipelineActivityData(): Promise<ServerActivityData[]> {
    return new Promise((resolve, reject) => {
        Promise.all([
            getServerNotifications(['Pipeline']),
            getPipelineJobStatuses()
        ]).then((responses) => {
                const [notifications, statuses] = responses;
                resolve(notifications.concat(...statuses).sort(naturalSortByProperty('Created')));
            })
            .catch(reason => {
                console.error(reason);
                reject('There was a problem retrieving your notification data.  Try refreshing the page.');
            });
    });
}
